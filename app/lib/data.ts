import { neon } from "@neondatabase/serverless";

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("缺少 DATABASE_URL");
  }

  return neon(process.env.DATABASE_URL);
}

export async function fetchCardData() {
  const sql = getSql();

  const [
    invoiceCountResult,
    customerCountResult,
    invoiceStatusResult,
  ] = await Promise.all([
    sql`SELECT COUNT(*)::int AS count FROM invoices`,
    sql`SELECT COUNT(*)::int AS count FROM customers`,
    sql`
      SELECT
        COALESCE(
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END),
          0
        )::int AS paid,
        COALESCE(
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END),
          0
        )::int AS pending
      FROM invoices
    `,
  ]);

  return {
    numberOfInvoices: invoiceCountResult[0].count,
    numberOfCustomers: customerCountResult[0].count,
    totalPaidInvoices: invoiceStatusResult[0].paid,
    totalPendingInvoices: invoiceStatusResult[0].pending,
  };
}

export type Revenue = {
  month: string;
  revenue: number;
};

export async function fetchRevenue(): Promise<Revenue[]> {
  const sql = getSql();

  const data = await sql`
    SELECT month, revenue
    FROM revenue
    ORDER BY CASE month
      WHEN 'Jan' THEN 1
      WHEN 'Feb' THEN 2
      WHEN 'Mar' THEN 3
      WHEN 'Apr' THEN 4
      WHEN 'May' THEN 5
      WHEN 'Jun' THEN 6
      WHEN 'Jul' THEN 7
      WHEN 'Aug' THEN 8
      WHEN 'Sep' THEN 9
      WHEN 'Oct' THEN 10
      WHEN 'Nov' THEN 11
      WHEN 'Dec' THEN 12
    END
  `;
  return data.map((item) => ({
    month: String(item.month),
    revenue: Number(item.revenue),
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

export async function fetchLatestInvoices(): Promise<LatestInvoice[]> {
  const sql = getSql();

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
      invoice.status === "paid" ? "paid" : "pending",
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
  const offset = (currentPage - 1) * INVOICES_PER_PAGE;
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
      customers.name ILIKE ${searchTerm}
      OR customers.email ILIKE ${searchTerm}
      OR invoices.status ILIKE ${searchTerm}
      OR invoices.date::text ILIKE ${searchTerm}
      OR invoices.amount::text ILIKE ${searchTerm}
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
      invoice.status === "paid" ? "paid" : "pending",
    date: String(invoice.date),
  }));
}

export async function fetchInvoicesPages(
  query: string,
): Promise<number> {
  const sql = getSql();
  const searchTerm = `%${query}%`;

  const data = await sql`
    SELECT COUNT(*)::int AS count
    FROM invoices
    JOIN customers
      ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${searchTerm}
      OR customers.email ILIKE ${searchTerm}
      OR invoices.status ILIKE ${searchTerm}
      OR invoices.date::text ILIKE ${searchTerm}
      OR invoices.amount::text ILIKE ${searchTerm}
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
  const sql = getSql();

  const data = await sql`
    SELECT id, name
    FROM customers
    ORDER BY name ASC
  `;

  return data.map((customer) => ({
    id: String(customer.id),
    name: String(customer.name),
  }));
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

  const data = await sql`
    SELECT
      id,
      customer_id,
      amount,
      status
    FROM invoices
    WHERE id = ${id}
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
      invoice.status === "paid" ? "paid" : "pending",
  };
}