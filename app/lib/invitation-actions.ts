"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
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
import {
  createTracedActionFailure,
} from "@/app/lib/action-error";

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
  requestId?: string;
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
  } catch (error) {
  return createTracedActionFailure({
    event: "team.invitation.create.failed",
    message: "创建邀请失败，请稍后重试。",
    error,
  });
}

  return {
    success: true,
    message: "邀请创建成功，7 天内有效。",
    invitationPath,
  };
}

export type AcceptInvitationState = {
  success?: boolean;
  message?: string;
  teamPath?: string;
};

export async function acceptTeamInvitation(
  token: string,
  _previousState: AcceptInvitationState,
  _formData: FormData,
): Promise<AcceptInvitationState> {
  void _previousState;
  void _formData;

  if (!/^[0-9a-f]{64}$/.test(token)) {
    return {
      success: false,
      message: "邀请链接无效。",
    };
  }

  let teamId: string;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "请先登录，再接受邀请。",
      };
    }

    const userId = session.user.id;
    const tokenHash = hashInvitationToken(token);

    const result = await db.execute(sql`
      WITH valid_invitation AS MATERIALIZED (
        SELECT i.id, i.team_id
        FROM team_invitations AS i
        INNER JOIN users AS u
          ON u.id = ${userId}::uuid
        WHERE i.token_hash = ${tokenHash}
          AND lower(trim(i.email)) = lower(trim(u.email))
          AND i.accepted_at IS NULL
          AND i.revoked_at IS NULL
          AND i.expires_at > now()
        FOR UPDATE OF i
      ),
      added_member AS (
        INSERT INTO team_members (
          team_id,
          user_id,
          role
        )
        SELECT
          team_id,
          ${userId}::uuid,
          'member'
        FROM valid_invitation
        ON CONFLICT (team_id, user_id) DO NOTHING
        RETURNING team_id
      ),
      accepted_invitation AS (
        UPDATE team_invitations AS i
        SET accepted_at = now()
        FROM valid_invitation AS v
        WHERE i.id = v.id
          AND (
            EXISTS (
              SELECT 1
              FROM added_member AS a
              WHERE a.team_id = v.team_id
            )
            OR EXISTS (
              SELECT 1
              FROM team_members AS m
              WHERE m.team_id = v.team_id
                AND m.user_id = ${userId}::uuid
            )
          )
        RETURNING i.team_id
      ),
      recorded_activity AS (
        INSERT INTO activity_logs (
          team_id,
          user_id,
          action,
          details
        )
        SELECT
          team_id,
          ${userId}::uuid,
          'team.invitation_accepted',
          '通过邀请加入了团队'
        FROM added_member
        RETURNING id
      )
      SELECT team_id
      FROM accepted_invitation
    `);

    const row = result.rows[0];

    if (!row) {
      return {
        success: false,
        message:
          "无法接受邀请：邮箱不匹配，或邀请已过期、撤销、接受。请刷新页面确认。",
      };
    }

    teamId = String(row.team_id);
  } catch {
    console.error("接受团队邀请失败。");

    return {
      success: false,
      message: "接受邀请失败，请稍后重试。",
    };
  }

  revalidatePath("/dashboard/teams");
  revalidatePath(`/dashboard/teams/${teamId}`);

  return {
    success: true,
    message: "邀请已接受，你已是团队成员。",
    teamPath: `/dashboard/teams/${teamId}`,
  };
}