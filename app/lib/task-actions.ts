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