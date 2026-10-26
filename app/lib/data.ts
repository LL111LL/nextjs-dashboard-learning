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