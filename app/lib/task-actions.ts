"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/app/db";
import {
  activityLogs,
  projects,
  projectTasks,
  teamMembers,
} from "@/app/db/schema";
import { auth } from "@/auth";

const TaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "任务标题至少需要 2 个字符。")
    .max(200, "任务标题不能超过 200 个字符。"),

  description: z
    .string()
    .trim()
    .max(2000, "任务说明不能超过 2000 个字符。"),

  assigneeId: z.preprocess(
    (value) =>
      value === "" || value === null
        ? null
        : value,
    z
      .string()
      .uuid("负责人 ID 无效。")
      .nullable(),
  ),

  dueDate: z.preprocess(
    (value) =>
      value === "" || value === null
        ? null
        : value,
    z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "截止日期格式无效。",
      )
      .nullable(),
  ),
});

export type TaskActionState = {
  success?: boolean;
  errors?: {
    title?: string[];
    description?: string[];
    assigneeId?: string[];
    dueDate?: string[];
  };
  message?: string | null;
};

export async function createTask(
  teamId: string,
  projectId: string,
  _previousState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  void _previousState;

  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录。",
    };
  }

  const idsResult = z
    .object({
      teamId: z.string().uuid(),
      projectId: z.string().uuid(),
    })
    .safeParse({
      teamId,
      projectId,
    });

  if (!idsResult.success) {
    return {
      success: false,
      message: "团队或项目 ID 无效。",
    };
  }

  const formResult = TaskSchema.safeParse({
    title: formData.get("title"),
    description:
      formData.get("description") ?? "",
    assigneeId: formData.get("assigneeId"),
    dueDate: formData.get("dueDate"),
  });

  if (!formResult.success) {
    return {
      success: false,
      errors:
        formResult.error.flatten().fieldErrors,
      message: "创建任务失败，请检查表单内容。",
    };
  }

  const {
    teamId: validTeamId,
    projectId: validProjectId,
  } = idsResult.data;

  const userId = session.user.id;
  const {
    title,
    description,
    assigneeId,
    dueDate,
  } = formResult.data;

  try {
    // 当前操作者必须属于该团队。
    const [membership] = await db
      .select({
        id: teamMembers.id,
      })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, validTeamId),
          eq(teamMembers.userId, userId),
        ),
      )
      .limit(1);

    if (!membership) {
      return {
        success: false,
        message: "你不是该团队的成员。",
      };
    }

    // 项目必须属于当前团队。
    const [project] = await db
      .select({
        name: projects.name,
      })
      .from(projects)
      .where(
        and(
          eq(projects.id, validProjectId),
          eq(projects.teamId, validTeamId),
        ),
      )
      .limit(1);

    if (!project) {
      return {
        success: false,
        message: "找不到该团队项目。",
      };
    }

    // 如果选择了负责人，负责人也必须属于当前团队。
    if (assigneeId) {
      const [assigneeMembership] = await db
        .select({
          id: teamMembers.id,
        })
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, validTeamId),
            eq(
              teamMembers.userId,
              assigneeId,
            ),
          ),
        )
        .limit(1);

      if (!assigneeMembership) {
        return {
          success: false,
          errors: {
            assigneeId: [
              "所选负责人不是该团队成员。",
            ],
          },
          message: "创建任务失败。",
        };
      }
    }

    const taskId = crypto.randomUUID();

    await db.batch([
      db.insert(projectTasks).values({
        id: taskId,
        projectId: validProjectId,
        title,
        description:
          description.length > 0
            ? description
            : null,
        status: "todo",
        assigneeId,
        createdBy: userId,
        dueDate,
      }),

      db.insert(activityLogs).values({
        teamId: validTeamId,
        userId,
        action: "task.created",
        details:
          `在项目“${project.name}”中创建了任务“${title}”`,
      }),
    ]);
  } catch (error) {
    console.error("创建项目任务失败：", error);

    return {
      success: false,
      message: "数据库错误：创建任务失败。",
    };
  }

  revalidatePath(
    `/dashboard/teams/${validTeamId}/projects/${validProjectId}`,
  );
  revalidatePath(
    `/dashboard/teams/${validTeamId}`,
  );

  return {
    success: true,
    message: "任务创建成功。",
  };
}

const TaskStatusSchema = z.enum([
  "todo",
  "in_progress",
  "done",
]);

export type UpdateTaskStatusState = {
  success?: boolean;
  message?: string | null;
};

export async function updateTaskStatus(
  teamId: string,
  projectId: string,
  taskId: string,
  nextStatus: string,
  _previousState: UpdateTaskStatusState,
  _formData: FormData,
): Promise<UpdateTaskStatusState> {
  void _previousState;
  void _formData;

  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录。",
    };
  }

  const inputResult = z
    .object({
      teamId: z.string().uuid(),
      projectId: z.string().uuid(),
      taskId: z.string().uuid(),
      nextStatus: TaskStatusSchema,
    })
    .safeParse({
      teamId,
      projectId,
      taskId,
      nextStatus,
    });

  if (!inputResult.success) {
    return {
      success: false,
      message: "任务状态参数无效。",
    };
  }

  const {
    teamId: validTeamId,
    projectId: validProjectId,
    taskId: validTaskId,
    nextStatus: validNextStatus,
  } = inputResult.data;

  const userId = session.user.id;

  try {
    // 当前用户必须属于该团队。
    const [membership] = await db
      .select({
        id: teamMembers.id,
      })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, validTeamId),
          eq(teamMembers.userId, userId),
        ),
      )
      .limit(1);

    if (!membership) {
      return {
        success: false,
        message: "你不是该团队的成员。",
      };
    }

    // 同时验证：
    // 任务属于项目，项目属于团队。
    const [currentTask] = await db
      .select({
        title: projectTasks.title,
        status: projectTasks.status,
        projectName: projects.name,
      })
      .from(projectTasks)
      .innerJoin(
        projects,
        eq(projectTasks.projectId, projects.id),
      )
      .where(
        and(
          eq(projectTasks.id, validTaskId),
          eq(
            projectTasks.projectId,
            validProjectId,
          ),
          eq(projects.teamId, validTeamId),
        ),
      )
      .limit(1);

    if (!currentTask) {
      return {
        success: false,
        message: "找不到该团队项目中的任务。",
      };
    }

    if (currentTask.status === validNextStatus) {
      return {
        success: false,
        message: "任务已经处于该状态。",
      };
    }

    const statusLabels = {
      todo: "待处理",
      in_progress: "进行中",
      done: "已完成",
    } as const;

    const previousStatus =
      currentTask.status as keyof typeof statusLabels;

    await db.batch([
      db
        .update(projectTasks)
        .set({
          status: validNextStatus,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectTasks.id, validTaskId),
            eq(
              projectTasks.projectId,
              validProjectId,
            ),
          ),
        ),

      db.insert(activityLogs).values({
        teamId: validTeamId,
        userId,
        action: "task.status_changed",
        details:
          `将项目“${currentTask.projectName}”中的任务“${currentTask.title}”从“${statusLabels[previousStatus]}”修改为“${statusLabels[validNextStatus]}”`,
      }),
    ]);
  } catch (error) {
    console.error("修改任务状态失败：", error);

    return {
      success: false,
      message: "数据库错误：修改任务状态失败。",
    };
  }

  revalidatePath(
    `/dashboard/teams/${validTeamId}/projects/${validProjectId}`,
  );
  revalidatePath(
    `/dashboard/teams/${validTeamId}`,
  );

  return {
    success: true,
    message: "任务状态修改成功。",
  };
}

export type UpdateTaskState = TaskActionState;

export async function updateTask(
  teamId: string,
  projectId: string,
  taskId: string,
  _previousState: UpdateTaskState,
  formData: FormData,
): Promise<UpdateTaskState> {
  void _previousState;

  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录。",
    };
  }

  const idsResult = z
    .object({
      teamId: z.string().uuid(),
      projectId: z.string().uuid(),
      taskId: z.string().uuid(),
    })
    .safeParse({
      teamId,
      projectId,
      taskId,
    });

  if (!idsResult.success) {
    return {
      success: false,
      message: "团队、项目或任务 ID 无效。",
    };
  }

  const formResult = TaskSchema.safeParse({
    title: formData.get("title"),
    description:
      formData.get("description") ?? "",
    assigneeId: formData.get("assigneeId"),
    dueDate: formData.get("dueDate"),
  });

  if (!formResult.success) {
    return {
      success: false,
      errors:
        formResult.error.flatten().fieldErrors,
      message: "更新任务失败，请检查表单内容。",
    };
  }

  const {
    teamId: validTeamId,
    projectId: validProjectId,
    taskId: validTaskId,
  } = idsResult.data;

  const userId = session.user.id;
  const {
    title,
    description,
    assigneeId,
    dueDate,
  } = formResult.data;

  const normalizedDescription =
    description.length > 0 ? description : null;

  try {
    // 当前用户必须属于团队。
    const [membership] = await db
      .select({
        id: teamMembers.id,
      })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, validTeamId),
          eq(teamMembers.userId, userId),
        ),
      )
      .limit(1);

    if (!membership) {
      return {
        success: false,
        message: "你不是该团队的成员。",
      };
    }

    // 任务必须属于该项目，项目必须属于该团队。
    const [currentTask] = await db
      .select({
        title: projectTasks.title,
        description: projectTasks.description,
        assigneeId: projectTasks.assigneeId,
        dueDate: projectTasks.dueDate,
        projectName: projects.name,
      })
      .from(projectTasks)
      .innerJoin(
        projects,
        eq(projectTasks.projectId, projects.id),
      )
      .where(
        and(
          eq(projectTasks.id, validTaskId),
          eq(
            projectTasks.projectId,
            validProjectId,
          ),
          eq(projects.teamId, validTeamId),
        ),
      )
      .limit(1);

    if (!currentTask) {
      return {
        success: false,
        message: "找不到该团队项目中的任务。",
      };
    }

    // 新负责人必须属于同一个团队。
    if (assigneeId) {
      const [assigneeMembership] = await db
        .select({
          id: teamMembers.id,
        })
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, validTeamId),
            eq(
              teamMembers.userId,
              assigneeId,
            ),
          ),
        )
        .limit(1);

      if (!assigneeMembership) {
        return {
          success: false,
          errors: {
            assigneeId: [
              "所选负责人不是该团队成员。",
            ],
          },
          message: "更新任务失败。",
        };
      }
    }

    const hasChanges =
      currentTask.title !== title ||
      currentTask.description !==
        normalizedDescription ||
      currentTask.assigneeId !== assigneeId ||
      currentTask.dueDate !== dueDate;

    if (!hasChanges) {
      return {
        success: false,
        message: "任务内容没有变化。",
      };
    }

    await db.batch([
      db
        .update(projectTasks)
        .set({
          title,
          description: normalizedDescription,
          assigneeId,
          dueDate,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectTasks.id, validTaskId),
            eq(
              projectTasks.projectId,
              validProjectId,
            ),
          ),
        ),

      db.insert(activityLogs).values({
        teamId: validTeamId,
        userId,
        action: "task.updated",
        details:
          currentTask.title === title
            ? `更新了项目“${currentTask.projectName}”中的任务“${title}”`
            : `将任务“${currentTask.title}”重命名为“${title}”`,
      }),
    ]);
  } catch (error) {
    console.error("更新项目任务失败：", error);

    return {
      success: false,
      message: "数据库错误：更新任务失败。",
    };
  }

  revalidatePath(
    `/dashboard/teams/${validTeamId}/projects/${validProjectId}`,
  );
  revalidatePath(
    `/dashboard/teams/${validTeamId}`,
  );

  return {
    success: true,
    message: "任务更新成功。",
  };
}