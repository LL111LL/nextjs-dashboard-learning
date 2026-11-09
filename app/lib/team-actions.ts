"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/app/db";
import {
  teamMembers,
  teams,
} from "@/app/db/schema";
import { auth } from "@/auth";

const TeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "团队名称至少需要 2 个字符。")
    .max(100, "团队名称不能超过 100 个字符。"),
});

export type TeamActionState = {
  success?: boolean;
  errors?: {
    name?: string[];
  };
  message?: string | null;
};

export async function createTeam(
  _previousState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  void _previousState;

  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录。",
    };
  }

  const result = TeamSchema.safeParse({
    name: formData.get("name"),
  });

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
      message: "创建团队失败，请检查表单内容。",
    };
  }

  const teamId = crypto.randomUUID();
  const userId = session.user.id;

  try {
    await db.batch([
      db.insert(teams).values({
        id: teamId,
        name: result.data.name,
        createdBy: userId,
      }),

      db.insert(teamMembers).values({
        teamId,
        userId,
        role: "owner",
      }),
    ]);
  } catch (error) {
    console.error("创建团队失败：", error);

    return {
      success: false,
      message: "数据库错误：创建团队失败。",
    };
  }

  revalidatePath("/dashboard/teams");

  return {
    success: true,
    message: "团队创建成功。",
  };
}