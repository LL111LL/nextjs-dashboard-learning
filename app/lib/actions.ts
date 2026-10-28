"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export type InvoiceActionState = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};
const CreateInvoiceSchema = z.object({
  customerId: z.string().uuid({
    message: "请选择一个有效的客户。",
  }),
  amount: z.coerce.number().positive({
    message: "金额必须大于 0。",
  }),
  status: z.enum(["pending", "paid"], {
    message: "请选择发票状态。",
  }),
});

export async function createInvoice(
  _previousState: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const result = CreateInvoiceSchema.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      message: "创建发票失败，请检查表单中的错误。",
    };
  }

  const { customerId, amount, status } = result.data;
  const amountInCents = Math.round(amount * 100);
  const date = new Date().toISOString().split("T")[0];

  if (!process.env.DATABASE_URL) {
    return {
      message: "服务器没有配置数据库连接。",
    };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    console.error("创建发票失败：", error);

    return {
      message: "数据库错误：创建发票失败。",
    };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(
  id: string,
  _previousState: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const idResult = z.string().uuid().safeParse(id);

  if (!idResult.success) {
    return {
      message: "发票 ID 无效。",
    };
  }

  const formResult = CreateInvoiceSchema.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!formResult.success) {
    return {
      errors: formResult.error.flatten().fieldErrors,
      message: "更新发票失败，请检查表单中的错误。",
    };
  }

  if (!process.env.DATABASE_URL) {
    return {
      message: "服务器没有配置数据库连接。",
    };
  }

  const invoiceId = idResult.data;
  const { customerId, amount, status } = formResult.data;
  const amountInCents = Math.round(amount * 100);

  try {
    const sql = neon(process.env.DATABASE_URL);

    const updatedInvoices = await sql`
      UPDATE invoices
      SET
        customer_id = ${customerId},
        amount = ${amountInCents},
        status = ${status}
      WHERE id = ${invoiceId}
      RETURNING id
    `;

    if (updatedInvoices.length === 0) {
      return {
        message: "找不到需要更新的发票。",
      };
    }
  } catch (error) {
    console.error("更新发票失败：", error);

    return {
      message: "数据库错误：更新发票失败。",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  const idResult = z.string().uuid().safeParse(id);

  if (!idResult.success) {
    throw new Error("发票 ID 无效");
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("缺少 DATABASE_URL");
  }

  const sql = neon(process.env.DATABASE_URL);

  const deletedInvoices = await sql`
    DELETE FROM invoices
    WHERE id = ${idResult.data}
    RETURNING id
  `;

  if (deletedInvoices.length === 0) {
    throw new Error("找不到需要删除的发票");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/invoices");
}

export async function authenticate(
  _previousState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "邮箱或密码不正确。";
        default:
          return "登录失败，请稍后重试。";
      }
    }

    throw error;
  }
}