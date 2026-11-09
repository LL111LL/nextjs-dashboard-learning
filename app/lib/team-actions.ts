"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/app/db";
import {
  teamMembers,
  teams,
  users,
} from "@/app/db/schema";
import { auth } from "@/auth";
import {and,eq,sql as drizzleSql,} from"drizzle-orm"

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

const AddTeamMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("请输入有效的电子邮箱。"),
});

export type AddTeamMemberState = {
  success?: boolean;
  errors?: {
    email?: string[];
  };
  message?: string | null;
};

export async function addTeamMember(
  teamId: string,
  _previousState: AddTeamMemberState,
  formData: FormData,
): Promise<AddTeamMemberState> {
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

  const formResult =
    AddTeamMemberSchema.safeParse({
      email: formData.get("email"),
    });

  if (!formResult.success) {
    return {
      success: false,
      errors:
        formResult.error.flatten().fieldErrors,
      message: "添加成员失败，请检查邮箱。",
    };
  }

  const validTeamId = teamIdResult.data;
  const email = formResult.data.email;

  try {
    // 权限检查：当前用户必须是这个团队的 owner。
    const [ownerMembership] = await db
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
          eq(teamMembers.role, "owner"),
        ),
      )
      .limit(1);

    if (!ownerMembership) {
      return {
        success: false,
        message: "只有团队所有者可以添加成员。",
      };
    }

    // 根据邮箱寻找已经注册的用户。
    const [newMember] = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(
        drizzleSql`
          LOWER(${users.email}) = ${email}
        `,
      )
      .limit(1);

    if (!newMember) {
      return {
        success: false,
        errors: {
          email: ["没有找到该邮箱对应的注册用户。"],
        },
        message: "添加成员失败。",
      };
    }

    // 检查该用户是否已经在团队中。
    const [existingMembership] = await db
      .select({
        id: teamMembers.id,
      })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, validTeamId),
          eq(teamMembers.userId, newMember.id),
        ),
      )
      .limit(1);

    if (existingMembership) {
      return {
        success: false,
        errors: {
          email: ["该用户已经是团队成员。"],
        },
        message: "添加成员失败。",
      };
    }

    await db.insert(teamMembers).values({
      teamId: validTeamId,
      userId: newMember.id,
      role: "member",
    });
  } catch (error) {
    console.error("添加团队成员失败：", error);

    return {
      success: false,
      message: "数据库错误：添加成员失败。",
    };
  }

  revalidatePath(
    `/dashboard/teams/${validTeamId}`,
  );

  return {
    success: true,
    message: "成员添加成功。",
  };
}

export type RemoveTeamMemberState = {
  success?: boolean;
  message?: string | null;
};

export async function removeTeamMember(
  teamId: string,
  memberUserId: string,
  _previousState: RemoveTeamMemberState,
  _formData: FormData,
): Promise<RemoveTeamMemberState> {
  void _previousState;
  void _formData;

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
      memberUserId: z.string().uuid(),
    })
    .safeParse({
      teamId,
      memberUserId,
    });

  if (!idsResult.success) {
    return {
      success: false,
      message: "团队或成员 ID 无效。",
    };
  }

  const {
    teamId: validTeamId,
    memberUserId: validMemberUserId,
  } = idsResult.data;

  try {
    // 服务端确认操作者确实是该团队的 owner。
    const [ownerMembership] = await db
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
          eq(teamMembers.role, "owner"),
        ),
      )
      .limit(1);

    if (!ownerMembership) {
      return {
        success: false,
        message: "只有团队所有者可以移除成员。",
      };
    }

    // 只允许删除 role=member 的记录。
    // 即使传入 owner 的用户 ID，也不会删除所有者。
    const removedMemberships = await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, validTeamId),
          eq(
            teamMembers.userId,
            validMemberUserId,
          ),
          eq(teamMembers.role, "member"),
        ),
      )
      .returning({
        id: teamMembers.id,
      });

    if (removedMemberships.length === 0) {
      return {
        success: false,
        message:
          "找不到该普通成员，或者该成员不能被移除。",
      };
    }
  } catch (error) {
    console.error("移除团队成员失败：", error);

    return {
      success: false,
      message: "数据库错误：移除成员失败。",
    };
  }

  revalidatePath(
    `/dashboard/teams/${validTeamId}`,
  );

  return {
    success: true,
    message: "成员已移除。",
  };
}