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