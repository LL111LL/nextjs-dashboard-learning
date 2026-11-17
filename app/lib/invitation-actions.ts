"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/app/db";
import {
  activityLogs,
  teamInvitations,
  teamMembers,
  users,
} from "@/app/db/schema";
import {
  getTeamOwnerAccess,
  getTeamAccessFailureMessage,
} from "@/app/lib/team-permissions";
import {
  generateInvitationToken,
  hashInvitationToken,
} from "@/app/lib/invitation-token";

const InvitationSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(255, "邮箱不能超过 255 个字符。")
    .email("请输入有效的电子邮箱。"),
});

export type CreateInvitationState = {
  success?: boolean;
  message?: string;
  errors?: {
    email?: string[];
  };
  invitationPath?: string;
};

export async function createTeamInvitation(
  teamId: string,
  _previousState: CreateInvitationState,
  formData: FormData,
): Promise<CreateInvitationState> {
  void _previousState;

  const parsed = InvitationSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "请检查邀请邮箱。",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  let invitationPath: string;

  try {
    const access = await getTeamOwnerAccess(teamId);

    if (!access.ok) {
      return {
        success: false,
        message: getTeamAccessFailureMessage(
          access.reason,
        ),
      };
    }

    const { email } = parsed.data;

    // 已经是团队成员，就不需要再邀请。
    const [existingMember] = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .innerJoin(
        users,
        eq(teamMembers.userId, users.id),
      )
      .where(
        and(
          eq(teamMembers.teamId, access.teamId),
          sql`lower(${users.email}) = ${email}`,
        ),
      )
      .limit(1);

    if (existingMember) {
      return {
        success: false,
        message: "该用户已经是团队成员。",
      };
    }

    const token = generateInvitationToken();
    const tokenHash = hashInvitationToken(token);

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    await db.batch([
      db.insert(teamInvitations).values({
        teamId: access.teamId,
        email,
        tokenHash,
        invitedBy: access.userId,
        expiresAt,
      }),

      db.insert(activityLogs).values({
        teamId: access.teamId,
        userId: access.userId,
        action: "team.invitation_created",
        details: `创建了发给 ${email} 的团队邀请`,
      }),
    ]);

    invitationPath = `/invite/${token}`;
  } catch {
    // 不打印原始错误，避免数据库参数中的敏感信息进入日志。
    console.error("创建团队邀请失败。");

    return {
      success: false,
      message: "创建邀请失败，请稍后重试。",
    };
  }

  return {
    success: true,
    message: "邀请创建成功，7 天内有效。",
    invitationPath,
  };
}