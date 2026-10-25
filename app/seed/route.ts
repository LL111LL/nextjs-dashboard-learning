import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import {
  users,
  customers,
  invoices,
  revenue,
} from "../lib/placeholder-data";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      { error: "缺少 DATABASE_URL" },
      { status: 500 },
    );
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        customer_id UUID NOT NULL REFERENCES customers(id),
        amount INTEGER NOT NULL,
        status VARCHAR(255) NOT NULL
          CHECK (status IN ('pending', 'paid')),
        date DATE NOT NULL,
        UNIQUE (customer_id, amount, date)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS revenue (
        month VARCHAR(4) PRIMARY KEY,
        revenue INTEGER NOT NULL
      )
    `;

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      await sql`
        INSERT INTO users (id, name, email, password)
        VALUES (
          ${user.id},
          ${user.name},
          ${user.email},
          ${hashedPassword}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }

    for (const customer of customers) {
      await sql`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (
          ${customer.id},
          ${customer.name},
          ${customer.email},
          ${customer.imageUrl}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }

    for (const invoice of invoices) {
      await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (
          ${invoice.customerId},
          ${invoice.amount},
          ${invoice.status},
          ${invoice.date}
        )
        ON CONFLICT (customer_id, amount, date) DO NOTHING
      `;
    }

    for (const item of revenue) {
      await sql`
        INSERT INTO revenue (month, revenue)
        VALUES (${item.month}, ${item.revenue})
        ON CONFLICT (month) DO NOTHING
      `;
    }

    return Response.json({
      message: "Database seeded successfully",
    });
  } catch (error) {
    console.error("Database seed failed:", error);

    return Response.json(
      { error: "Database seed failed" },
      { status: 500 },
    );
  }
}