"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";

const CustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "客户姓名至少需要 2 个字符。")
    .max(100, "客户姓名不能超过 100 个字符。"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("请输入有效的电子邮箱。"),
});

export type CustomerActionState = {
  errors?: {
    name?: string[];
    email?: string[];
  };
  message?: string | null;
};

export async function createCustomer(
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      message: "登录状态已失效，请重新登录。",
    };
  }

  const result = CustomerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      message: "创建客户失败，请检查表单内容。",
    };
  }

  if (!process.env.DATABASE_URL) {
    return {
      message: "服务器没有配置数据库连接。",
    };
  }

  const userId = session.user.id;
  const { name, email } = result.data;

  try {
    const sql = neon(process.env.DATABASE_URL);

    const existingCustomers = await sql`
      SELECT id
      FROM customers
      WHERE
        LOWER(email) = ${email}
        AND (
          owner_id IS NULL
          OR owner_id = ${userId}
        )
      LIMIT 1
    `;

    if (existingCustomers.length > 0) {
      return {
        errors: {
          email: ["该邮箱对应的客户已经存在。"],
        },
        message: "创建客户失败。",
      };
    }

    await sql`
      INSERT INTO customers (
        id,
        name,
        email,
        image_url,
        owner_id
      )
      VALUES (
        ${crypto.randomUUID()},
        ${name},
        ${email},
        ${"/globe.svg"},
        ${userId}
      )
    `;
  } catch (error) {
    console.error("创建客户失败：", error);

    return {
      message: "数据库错误：创建客户失败。",
    };
  }

  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/invoices/create");
  redirect("/dashboard/customers");
}