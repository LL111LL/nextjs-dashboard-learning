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