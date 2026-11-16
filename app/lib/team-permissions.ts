import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/app/db";
import { teamMembers } from "@/app/db/schema";
import { auth } from "@/auth";

export type TeamRole = "owner" | "member";

export type TeamAccessFailureReason =
  | "invalid_team_id"
  | "unauthenticated"
  | "not_member"
  | "not_owner";

export type TeamAccessSuccess = {
  ok: true;
  teamId: string;
  userId: string;
  membershipId: string;
  role: TeamRole;
};

export type TeamAccessFailure = {
  ok: false;
  reason: TeamAccessFailureReason;
};

export type TeamAccessResult =
  | TeamAccessSuccess
  | TeamAccessFailure;

/**
 * 检查当前登录用户是否属于指定团队。
 *
 * 不相信浏览器传入的 teamId：
 * 1. 验证 UUID；
 * 2. 读取服务端登录会话；
 * 3. 查询数据库成员关系。
 */
export async function getTeamAccess(
  teamId: string,
): Promise<TeamAccessResult> {
  const teamIdResult = z
    .string()
    .uuid()
    .safeParse(teamId);

  if (!teamIdResult.success) {
    return {
      ok: false,
      reason: "invalid_team_id",
    };
  }

  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false,
      reason: "unauthenticated",
    };
  }

  const validTeamId = teamIdResult.data;
  const userId = session.user.id;

  const [membership] = await db
    .select({
      id: teamMembers.id,
      role: teamMembers.role,
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
      ok: false,
      reason: "not_member",
    };
  }

  if (
    membership.role !== "owner" &&
    membership.role !== "member"
  ) {
    return {
      ok: false,
      reason: "not_member",
    };
  }

  return {
    ok: true,
    teamId: validTeamId,
    userId,
    membershipId: membership.id,
    role: membership.role,
  };
}

/**
 * 检查当前用户是否为指定团队的所有者。
 */
export async function getTeamOwnerAccess(
  teamId: string,
): Promise<TeamAccessResult> {
  const access = await getTeamAccess(teamId);

  if (!access.ok) {
    return access;
  }

  if (access.role !== "owner") {
    return {
      ok: false,
      reason: "not_owner",
    };
  }

  return access;
}

export function getTeamAccessFailureMessage(
  reason: TeamAccessFailureReason,
): string {
  switch (reason) {
    case "invalid_team_id":
      return "团队 ID 无效。";

    case "unauthenticated":
      return "登录状态已失效，请重新登录。";

    case "not_member":
      return "你不是该团队的成员。";

    case "not_owner":
      return "只有团队所有者可以执行此操作。";
  }
}