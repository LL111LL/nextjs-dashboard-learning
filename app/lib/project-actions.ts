"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/app/db";
import {
  activityLogs,
  projects,
  teamMembers,
} from "@/app/db/schema";
import { auth } from "@/auth";

const ProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "项目名称至少需要 2 个字符。")
    .max(150, "项目名称不能超过 150 个字符。"),

  description: z
    .string()
    .trim()
    .max(1000, "项目说明不能超过 1000 个字符。"),
});

export type ProjectActionState = {
  success?: boolean;
  errors?: {
    name?: string[];
    description?: string[];
  };
  message?: string | null;
};

export async function createProject(
  teamId: string,
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  void _previousState;

  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录。",
    };
  }

  const teamIdResult = z
    .string()
    .uuid()
    .safeParse(teamId);

  if (!teamIdResult.success) {
    return {
      success: false,
      message: "团队 ID 无效。",
    };
  }

  const formResult = ProjectSchema.safeParse({
    name: formData.get("name"),
    description:
      formData.get("description") ?? "",
  });

  if (!formResult.success) {
    return {
      success: false,
      errors:
        formResult.error.flatten().fieldErrors,
      message: "创建项目失败，请检查表单内容。",
    };
  }

  const validTeamId = teamIdResult.data;
  const userId = session.user.id;
  const projectId = crypto.randomUUID();
  const { name, description } = formResult.data;

  try {
    // 租户权限检查：当前用户必须属于该团队。
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

    await db.batch([
      db.insert(projects).values({
        id: projectId,
        teamId: validTeamId,
        name,
        description:
          description.length > 0
            ? description
            : null,
        status: "active",
        createdBy: userId,
      }),

      db.insert(activityLogs).values({
        teamId: validTeamId,
        userId,
        action: "project.created",
        details: `创建了项目“${name}”`,
      }),
    ]);
  } catch (error) {
    console.error("创建团队项目失败：", error);

    return {
      success: false,
      message: "数据库错误：创建项目失败。",
    };
  }

  revalidatePath(
    `/dashboard/teams/${validTeamId}/projects`,
  );

  return {
    success: true,
    message: "项目创建成功。",
  };
}

const ProjectStatusSchema = z.enum([
  "active",
  "completed",
  "archived",
]);

export type UpdateProjectStatusState = {
  success?: boolean;
  message?: string | null;
};

export async function updateProjectStatus(
  teamId: string,
  projectId: string,
  nextStatus: string,
  _previousState: UpdateProjectStatusState,
  _formData: FormData,
): Promise<UpdateProjectStatusState> {
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
      nextStatus: ProjectStatusSchema,
    })
    .safeParse({
      teamId,
      projectId,
      nextStatus,
    });

  if (!inputResult.success) {
    return {
      success: false,
      message: "项目状态参数无效。",
    };
  }

  const {
    teamId: validTeamId,
    projectId: validProjectId,
    nextStatus: validNextStatus,
  } = inputResult.data;

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
          eq(
            teamMembers.userId,
            session.user.id,
          ),
        ),
      )
      .limit(1);

    if (!membership) {
      return {
        success: false,
        message: "你不是该团队的成员。",
      };
    }

    // 同时使用 projectId 和 teamId，防止跨团队操作。
    const [currentProject] = await db
      .select({
        name: projects.name,
        status: projects.status,
      })
      .from(projects)
      .where(
        and(
          eq(projects.id, validProjectId),
          eq(projects.teamId, validTeamId),
        ),
      )
      .limit(1);

    if (!currentProject) {
      return {
        success: false,
        message: "找不到该团队项目。",
      };
    }

    if (currentProject.status === validNextStatus) {
      return {
        success: false,
        message: "项目已经处于该状态。",
      };
    }

    const statusLabels = {
      active: "进行中",
      completed: "已完成",
      archived: "已归档",
    } as const;

    await db.batch([
      db
        .update(projects)
        .set({
          status: validNextStatus,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projects.id, validProjectId),
            eq(projects.teamId, validTeamId),
          ),
        ),

      db.insert(activityLogs).values({
        teamId: validTeamId,
        userId: session.user.id,
        action: "project.status_changed",
        details:
          `将项目“${currentProject.name}”的状态从“${
            statusLabels[
              currentProject.status as keyof typeof statusLabels
            ]
          }”修改为“${statusLabels[validNextStatus]}”`,
      }),
    ]);
  } catch (error) {
    console.error("修改项目状态失败：", error);

    return {
      success: false,
      message: "数据库错误：修改项目状态失败。",
    };
  }

  revalidatePath(
    `/dashboard/teams/${validTeamId}/projects`,
  );
  revalidatePath(
    `/dashboard/teams/${validTeamId}`,
  );

  return {
    success: true,
    message: "项目状态修改成功。",
  };
}

export type UpdateProjectState = {
  success?: boolean;
  errors?: {
    name?: string[];
    description?: string[];
  };
  message?: string | null;
};

export async function updateProject(
  teamId: string,
  projectId: string,
  _previousState: UpdateProjectState,
  formData: FormData,
): Promise<UpdateProjectState> {
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

  const formResult = ProjectSchema.safeParse({
    name: formData.get("name"),
    description:
      formData.get("description") ?? "",
  });

  if (!formResult.success) {
    return {
      success: false,
      errors:
        formResult.error.flatten().fieldErrors,
      message: "更新项目失败，请检查表单内容。",
    };
  }

  const {
    teamId: validTeamId,
    projectId: validProjectId,
  } = idsResult.data;

  const userId = session.user.id;
  const { name, description } = formResult.data;
  const normalizedDescription =
    description.length > 0 ? description : null;

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

    // 必须同时用项目 ID 和团队 ID 查询。
    const [currentProject] = await db
      .select({
        name: projects.name,
        description: projects.description,
      })
      .from(projects)
      .where(
        and(
          eq(projects.id, validProjectId),
          eq(projects.teamId, validTeamId),
        ),
      )
      .limit(1);

    if (!currentProject) {
      return {
        success: false,
        message: "找不到该团队项目。",
      };
    }

    if (
      currentProject.name === name &&
      currentProject.description ===
        normalizedDescription
    ) {
      return {
        success: false,
        message: "项目内容没有变化。",
      };
    }

    await db.batch([
      db
        .update(projects)
        .set({
          name,
          description: normalizedDescription,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projects.id, validProjectId),
            eq(projects.teamId, validTeamId),
          ),
        ),

      db.insert(activityLogs).values({
        teamId: validTeamId,
        userId,
        action: "project.updated",
        details:
          currentProject.name === name
            ? `更新了项目“${name}”的说明`
            : `将项目“${currentProject.name}”重命名为“${name}”`,
      }),
    ]);
  } catch (error) {
    console.error("更新团队项目失败：", error);

    return {
      success: false,
      message: "数据库错误：更新项目失败。",
    };
  }

  revalidatePath(
    `/dashboard/teams/${validTeamId}/projects`,
  );
  revalidatePath(
    `/dashboard/teams/${validTeamId}`,
  );

  return {
    success: true,
    message: "项目更新成功。",
  };
}