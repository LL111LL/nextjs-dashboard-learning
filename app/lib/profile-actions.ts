"use server";

import { neon } from "@neondatabase/serverless";
import { compare, hash } from "bcryptjs";
import { z } from "zod";

import { auth } from "@/auth";

const ChangePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "请输入当前密码。"),
    newPassword: z
      .string()
      .min(8, "新密码至少需要 8 个字符。"),
    confirmPassword: z.string(),
  })
  .refine(
    (data) =>
      data.newPassword === data.confirmPassword,
    {
      message: "两次输入的新密码不一致。",
      path: ["confirmPassword"],
    },
  )
  .refine(
    (data) =>
      data.currentPassword !== data.newPassword,
    {
      message: "新密码不能与当前密码相同。",
      path: ["newPassword"],
    },
  );

export type ChangePasswordState = {
  success?: boolean;
  errors?: {
    currentPassword?: string[];
    newPassword?: string[];
    confirmPassword?: string[];
  };
  message?: string | null;
};

export async function changePassword(
  _previousState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录。",
    };
  }

  const result = ChangePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
      message: "修改失败，请检查表单内容。",
    };
  }

  if (!process.env.DATABASE_URL) {
    return {
      success: false,
      message: "服务器没有配置数据库连接。",
    };
  }

  const { currentPassword, newPassword } =
    result.data;

  try {
    const sql = neon(process.env.DATABASE_URL);

    const users = await sql`
      SELECT password
      FROM users
      WHERE id = ${session.user.id}
      LIMIT 1
    `;

    if (users.length === 0) {
      return {
        success: false,
        message: "找不到当前用户。",
      };
    }

    const passwordMatches = await compare(
      currentPassword,
      String(users[0].password),
    );

    if (!passwordMatches) {
      return {
        success: false,
        errors: {
          currentPassword: ["当前密码不正确。"],
        },
        message: "修改密码失败。",
      };
    }

    const passwordHash = await hash(newPassword, 10);

    await sql`
      UPDATE users
      SET password = ${passwordHash}
      WHERE id = ${session.user.id}
    `;

    return {
      success: true,
      message: "密码修改成功。",
      errors: {},
    };
  } catch (error) {
    console.error("修改密码失败：", error);

    return {
      success: false,
      message: "数据库错误：修改密码失败。",
    };
  }
}