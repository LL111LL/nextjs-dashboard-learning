"use server";

import { neon } from "@neondatabase/serverless";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";

const RegisterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "姓名至少需要 2 个字符。")
      .max(100, "姓名不能超过 100 个字符。"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("请输入有效的电子邮箱。"),
    password: z
      .string()
      .min(8, "密码至少需要 8 个字符。"),
    confirmPassword: z.string(),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "两次输入的密码不一致。",
      path: ["confirmPassword"],
    },
  );

export type RegisterState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  message?: string | null;
};

export async function registerUser(
  _previousState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const result = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      message: "注册失败，请检查表单内容。",
    };
  }

  if (!process.env.DATABASE_URL) {
    return {
      message: "服务器没有配置数据库连接。",
    };
  }

  const { name, email, password } = result.data;

  try {
    const sql = neon(process.env.DATABASE_URL);

    const existingUsers = await sql`
      SELECT id
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if (existingUsers.length > 0) {
      return {
        errors: {
          email: ["这个邮箱已经注册。"],
        },
        message: "注册失败，请使用其他邮箱。",
      };
    }

    const passwordHash = await hash(password, 10);

    await sql`
      INSERT INTO users (id, name, email, password)
      VALUES (
        ${crypto.randomUUID()},
        ${name},
        ${email},
        ${passwordHash}
      )
    `;
  } catch (error) {
    console.error("注册用户失败：", error);

    return {
      message: "数据库错误：注册失败，请稍后重试。",
    };
  }

  redirect("/login?registered=1");
}