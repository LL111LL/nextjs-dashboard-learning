import { neon } from "@neondatabase/serverless";
import { auth } from "@/auth";
import {and,asc,eq,isNull,or,sql as drizzleSql} from "drizzle-orm";
import {z} from "zod";

import { db } from "@/app/db";
import {customers as customersTable, invoices as invoicesTable} from "@/app/db/schema";

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("缺少 DATABASE_URL");
  }

  return neon(process.env.DATABASE_URL);
}

async function getAuthenticatedUserId(): Promise<string> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("用户未登录");
  }

  return session.user.id;
}

export async function fetchCardData() {
  const sql = getSql();
  const userId = await getAuthenticatedUserId();

  const [
    invoiceCountResult,
    customerCountResult,
    invoiceStatusResult,
  ] = await Promise.all([
    sql`
      SELECT COUNT(*)::int AS count
      FROM invoices
      WHERE user_id = ${userId}
    `,
    sql`
      SELECT COUNT(DISTINCT customer_id)::int AS count
      FROM invoices
      WHERE user_id = ${userId}
    `,
    sql`
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN status = 'paid' THEN amount
              ELSE 0
            END
          ),
          0
        )::int AS paid,
        COALESCE(
          SUM(
            CASE
              WHEN status = 'pending' THEN amount
              ELSE 0
            END
          ),
          0
        )::int AS pending
      FROM invoices
      WHERE user_id = ${userId}
    `,
  ]);

  return {
    numberOfInvoices:
      invoiceCountResult[0].count,
    numberOfCustomers:
      customerCountResult[0].count,
    totalPaidInvoices:
      invoiceStatusResult[0].paid,
    totalPendingInvoices:
      invoiceStatusResult[0].pending,
  };
}

export type Revenue = {
  month: string;
  revenue: number;
};

export async function fetchRevenue(): Promise<
  Revenue[]
> {
  const sql = getSql();
  const userId = await getAuthenticatedUserId();

  const data = await sql`
    SELECT
      EXTRACT(MONTH FROM date)::int
        AS month_number,
      COALESCE(SUM(amount), 0)::int
        AS revenue_in_cents
    FROM invoices
    WHERE
      user_id = ${userId}
      AND status = 'paid'
      AND EXTRACT(YEAR FROM date) =
        EXTRACT(YEAR FROM CURRENT_DATE)
    GROUP BY month_number
    ORDER BY month_number
  `;

  const monthlyTotals = new Map(
    data.map((item) => [
      Number(item.month_number),
      Number(item.revenue_in_cents),
    ]),
  );

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return months.map((month, index) => ({
    month,
    revenue:
      (monthlyTotals.get(index + 1) ?? 0) / 100,
  }));
}

export type LatestInvoice = {
  amount: number;
  name: string;
  email: string;
  imageUrl: string;
  date: string;
  status: "pending" | "paid";
};

export async function fetchLatestInvoices(): Promise<
  LatestInvoice[]
> {
  const sql = getSql();
  const userId = await getAuthenticatedUserId();

  const data = await sql`
    SELECT
      invoices.amount,
      invoices.date,
      invoices.status,
      customers.name,
      customers.email,
      customers.image_url
    FROM invoices
    JOIN customers
      ON invoices.customer_id = customers.id
    WHERE invoices.user_id = ${userId}
    ORDER BY invoices.date DESC
    LIMIT 5
  `;

  return data.map((invoice) => ({
    amount: Number(invoice.amount),
    name: String(invoice.name),
    email: String(invoice.email),
    imageUrl: String(invoice.image_url),
    date: String(invoice.date),
    status:
      invoice.status === "paid"
        ? "paid"
        : "pending",
  }));
}


const INVOICES_PER_PAGE = 3;

export type InvoiceRow = {
  id: string;
  customerId: string;
  name: string;
  email: string;
  imageUrl: string;
  amount: number;
  status: "pending" | "paid";
  date: string;
};

export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
): Promise<InvoiceRow[]> {
  const sql = getSql();
  const userId = await getAuthenticatedUserId();
  const offset =
    (currentPage - 1) * INVOICES_PER_PAGE;
  const searchTerm = `%${query}%`;

  const data = await sql`
    SELECT
      invoices.id,
      invoices.customer_id,
      invoices.amount,
      invoices.status,
      invoices.date,
      customers.name,
      customers.email,
      customers.image_url
    FROM invoices
    JOIN customers
      ON invoices.customer_id = customers.id
    WHERE
      invoices.user_id = ${userId}
      AND (
        customers.name ILIKE ${searchTerm}
        OR customers.email ILIKE ${searchTerm}
        OR invoices.status ILIKE ${searchTerm}
        OR invoices.date::text ILIKE ${searchTerm}
        OR invoices.amount::text ILIKE ${searchTerm}
      )
    ORDER BY invoices.date DESC
    LIMIT ${INVOICES_PER_PAGE}
    OFFSET ${offset}
  `;

  return data.map((invoice) => ({
    id: String(invoice.id),
    customerId: String(invoice.customer_id),
    name: String(invoice.name),
    email: String(invoice.email),
    imageUrl: String(invoice.image_url),
    amount: Number(invoice.amount),
    status:
      invoice.status === "paid"
        ? "paid"
        : "pending",
    date: String(invoice.date),
  }));
}

export async function fetchInvoicesPages(
  query: string,
): Promise<number> {
  const sql = getSql();
  const userId = await getAuthenticatedUserId();
  const searchTerm = `%${query}%`;

  const data = await sql`
    SELECT COUNT(*)::int AS count
    FROM invoices
    JOIN customers
      ON invoices.customer_id = customers.id
    WHERE
      invoices.user_id = ${userId}
      AND (
        customers.name ILIKE ${searchTerm}
        OR customers.email ILIKE ${searchTerm}
        OR invoices.status ILIKE ${searchTerm}
        OR invoices.date::text ILIKE ${searchTerm}
        OR invoices.amount::text ILIKE ${searchTerm}
      )
  `;

  return Math.ceil(
    Number(data[0].count) / INVOICES_PER_PAGE,
  );
}

export type CustomerOption = {
  id: string;
  name: string;
};

export async function fetchCustomers(): Promise<
  CustomerOption[]
> {
  const userId = await getAuthenticatedUserId();

  const customers = await db
    .select({
      id: customersTable.id,
      name: customersTable.name,
    })
    .from(customersTable)
    .where(
      or(
        isNull(customersTable.ownerId),
        eq(customersTable.ownerId, userId),
      ),
    )
    .orderBy(asc(customersTable.name));

  return customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
  }));
}

export type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
  invoiceCount: number;
  totalPaid: number;
  totalPending: number;
  isSystem: boolean;
};

export async function fetchCustomerSummaries(): Promise<
  CustomerSummary[]
> {
  const userId = await getAuthenticatedUserId();

  const customers = await db
    .select({
      id: customersTable.id,
      name: customersTable.name,
      email: customersTable.email,
      imageUrl: customersTable.imageUrl,
      ownerId: customersTable.ownerId,

      invoiceCount: drizzleSql<number>`
        COUNT(${invoicesTable.id})::int
      `,

      totalPaid: drizzleSql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${invoicesTable.status} = 'paid'
                THEN ${invoicesTable.amount}
              ELSE 0
            END
          ),
          0
        )::int
      `,

      totalPending: drizzleSql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${invoicesTable.status} = 'pending'
                THEN ${invoicesTable.amount}
              ELSE 0
            END
          ),
          0
        )::int
      `,
    })
    .from(customersTable)
    .leftJoin(
      invoicesTable,
      and(
        eq(
          invoicesTable.customerId,
          customersTable.id,
        ),
        eq(invoicesTable.userId, userId),
      ),
    )
    .where(
      or(
        isNull(customersTable.ownerId),
        eq(customersTable.ownerId, userId),
      ),
    )
    .groupBy(
      customersTable.id,
      customersTable.name,
      customersTable.email,
      customersTable.imageUrl,
      customersTable.ownerId,
    )
    .orderBy(asc(customersTable.name));

  return customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    imageUrl: customer.imageUrl,
    invoiceCount: Number(customer.invoiceCount),
    totalPaid: Number(customer.totalPaid),
    totalPending: Number(customer.totalPending),
    isSystem: customer.ownerId === null,
  }));
}

export type CustomerFormData = {
  id: string;
  name: string;
  email: string;
};

export async function fetchCustomerById(
  id: string,
): Promise<CustomerFormData | undefined> {
  const idResult = z.string().uuid().safeParse(id);

  if (!idResult.success) {
    return undefined;
  }

  const userId = await getAuthenticatedUserId();

  const [customer] = await db
    .select({
      id: customersTable.id,
      name: customersTable.name,
      email: customersTable.email,
    })
    .from(customersTable)
    .where(
      and(
        eq(customersTable.id, idResult.data),
        eq(customersTable.ownerId, userId),
      ),
    )
    .limit(1);

  return customer;
}

export type InvoiceFormData = {
  id: string;
  customerId: string;
  amount: number;
  status: "pending" | "paid";
};

export async function fetchInvoiceById(
  id: string,
): Promise<InvoiceFormData | undefined> {
  const sql = getSql();
  const userId = await getAuthenticatedUserId();

  const data = await sql`
    SELECT
      id,
      customer_id,
      amount,
      status
    FROM invoices
    WHERE
      id = ${id}
      AND user_id = ${userId}
    LIMIT 1
  `;

  const invoice = data[0];

  if (!invoice) {
    return undefined;
  }

  return {
    id: String(invoice.id),
    customerId: String(invoice.customer_id),
    amount: Number(invoice.amount),
    status:
      invoice.status === "paid"
        ? "paid"
        : "pending",
  };
}