"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const CreateInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  status: z.enum(["pending", "paid"]),
});

export async function createInvoice(
  formData: FormData,
) {
  const result = CreateInvoiceSchema.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!result.success) {
    throw new Error("发票表单数据无效");
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("缺少 DATABASE_URL");
  }

  const { customerId, amount, status } = result.data;
  const amountInCents = Math.round(amount * 100);
  const date = new Date().toISOString().split("T")[0];
  const sql = neon(process.env.DATABASE_URL);

  await sql`
    INSERT INTO invoices (
      customer_id,
      amount,
      status,
      date
    )
    VALUES (
      ${customerId},
      ${amountInCents},
      ${status},
      ${date}
    )
  `;

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(
  id: string,
  formData: FormData,
) {
  const idResult = z.string().uuid().safeParse(id);

  const formResult = CreateInvoiceSchema.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!idResult.success || !formResult.success) {
    throw new Error("发票更新数据无效");
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("缺少 DATABASE_URL");
  }

  const invoiceId = idResult.data;
  const { customerId, amount, status } =
    formResult.data;
  const amountInCents = Math.round(amount * 100);
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
    throw new Error("找不到需要更新的发票");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}