import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { relations } from "./relations";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("缺少 DATABASE_URL");
}

const client = neon(databaseUrl);

export const db = drizzle({
  client,
  relations,
});