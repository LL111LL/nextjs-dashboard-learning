import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "drizzle.config.ts 找不到 DATABASE_URL",
  );
}

export default defineConfig({
  dialect: "postgresql",

  schema: "./app/db/schema.ts",
  out: "./drizzle",

  dbCredentials: {
    url: process.env.DATABASE_URL,
  },

  schemaFilter: ["public"],

  tablesFilter: [
    "users",
    "customers",
    "invoices",
    "revenue",
  ],

  verbose: true,
});