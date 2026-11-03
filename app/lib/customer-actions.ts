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
export async function updateCustomer(
  id: string,
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      message: "登录状态已失效，请重新登录。",
    };
  }

  const idResult = z.string().uuid().safeParse(id);

  if (!idResult.success) {
    return {
      message: "客户 ID 无效。",
    };
  }

  const formResult = CustomerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!formResult.success) {
    return {
      errors: formResult.error.flatten().fieldErrors,
      message: "更新客户失败，请检查表单内容。",
    };
  }

  if (!process.env.DATABASE_URL) {
    return {
      message: "服务器没有配置数据库连接。",
    };
  }

  const userId = session.user.id;
  const customerId = idResult.data;
  const { name, email } = formResult.data;

  try {
    const sql = neon(process.env.DATABASE_URL);

    const duplicateCustomers = await sql`
      SELECT id
      FROM customers
      WHERE
        id <> ${customerId}
        AND LOWER(email) = ${email}
        AND (
          owner_id IS NULL
          OR owner_id = ${userId}
        )
      LIMIT 1
    `;

    if (duplicateCustomers.length > 0) {
      return {
        errors: {
          email: ["该邮箱对应的客户已经存在。"],
        },
        message: "更新客户失败。",
      };
    }

    const updatedCustomers = await sql`
      UPDATE customers
      SET
        name = ${name},
        email = ${email}
      WHERE
        id = ${customerId}
        AND owner_id = ${userId}
      RETURNING id
    `;

    if (updatedCustomers.length === 0) {
      return {
        message:
          "找不到该客户，或者你没有编辑权限。",
      };
    }
  } catch (error) {
    console.error("更新客户失败：", error);

    return {
      message: "数据库错误：更新客户失败。",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/customers");
}

export type DeleteCustomerState = {
  success?: boolean;
  message?: string | null;
};

export async function deleteCustomer(
  id: string,
  _previousState: DeleteCustomerState,
  _formData: FormData,
): Promise<DeleteCustomerState> {
  void _previousState;
  void _formData;

  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录。",
    };
  }

  const idResult = z.string().uuid().safeParse(id);

  if (!idResult.success) {
    return {
      success: false,
      message: "客户 ID 无效。",
    };
  }

  if (!process.env.DATABASE_URL) {
    return {
      success: false,
      message: "服务器没有配置数据库连接。",
    };
  }

  const userId = session.user.id;
  const customerId = idResult.data;

  try {
    const sql = neon(process.env.DATABASE_URL);

    const customers = await sql`
      SELECT
        customers.id,
        EXISTS (
          SELECT 1
          FROM invoices
          WHERE invoices.customer_id = customers.id
        ) AS has_invoices
      FROM customers
      WHERE
        customers.id = ${customerId}
        AND customers.owner_id = ${userId}
      LIMIT 1
    `;

    if (customers.length === 0) {
      return {
        success: false,
        message:
          "找不到该客户，或者你没有删除权限。",
      };
    }

    if (customers[0].has_invoices) {
      return {
        success: false,
        message:
          "该客户仍有关联发票，请先处理相关发票。",
      };
    }

    const deletedCustomers = await sql`
      DELETE FROM customers
      WHERE
        id = ${customerId}
        AND owner_id = ${userId}
      RETURNING id
    `;

    if (deletedCustomers.length === 0) {
      return {
        success: false,
        message: "客户删除失败。",
      };
    }
  } catch (error) {
    console.error("删除客户失败：", error);

    return {
      success: false,
      message:
        "数据库错误：客户可能仍被其他数据引用。",
    };
  }

  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/invoices/create");

  return {
    success: true,
    message: "客户已删除。",
  };
}