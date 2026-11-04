import { pgTable, uuid, varchar, integer, text, date,timestamp, index, foreignKey,  unique, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const customers = pgTable("customers", {
	id: uuid().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	imageUrl: varchar("image_url", { length: 255 }).notNull(),
	ownerId: uuid("owner_id"),
}, (table) => [
	foreignKey({
		columns: [table.ownerId],
		foreignColumns: [users.id],
		name: "customers_owner_id_fkey"
	}).onDelete("cascade"),
	index("customers_owner_id_idx").using("btree", table.ownerId.asc().nullsLast()),
]);

export const invoices = pgTable("invoices", {
	id: uuid().defaultRandom().primaryKey(),
	customerId: uuid("customer_id").notNull(),
	amount: integer().notNull(),
	status: varchar({ length: 255 }).notNull(),
	date: date().notNull(),
	userId: uuid("user_id").notNull(),
}, (table) => [
	foreignKey({
		columns: [table.customerId],
		foreignColumns: [customers.id],
		name: "invoices_customer_id_fkey"
	}),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "invoices_user_id_fkey"
	}).onDelete("cascade"),
	index("invoices_user_id_idx").using("btree", table.userId.asc().nullsLast()),
	unique("invoices_customer_id_amount_date_key").on(table.customerId, table.amount, table.date),check("invoices_status_check", sql`((status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying])::text[]))`),]);

export const revenue = pgTable("revenue", {
	month: varchar({ length: 4 }).primaryKey(),
	revenue: integer().notNull(),
});

export const users = pgTable("users", {
	id: uuid().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	email: text().notNull(),
	password: text().notNull(),
}, (table) => [
	unique("users_email_key").on(table.email),]);

export const teams = pgTable(
  "teams",
  {
    id: uuid().defaultRandom().primaryKey(),
    name: varchar({ length: 100 }).notNull(),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: "teams_created_by_fkey",
    }).onDelete("cascade"),

    index("teams_created_by_idx").on(table.createdBy),
  ],
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid().defaultRandom().primaryKey(),

    teamId: uuid("team_id").notNull(),

    userId: uuid("user_id").notNull(),

    role: varchar({ length: 20 })
      .default("member")
      .notNull(),

    joinedAt: timestamp("joined_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "team_members_team_id_fkey",
    }).onDelete("cascade"),

    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "team_members_user_id_fkey",
    }).onDelete("cascade"),

    unique("team_members_team_id_user_id_key").on(
      table.teamId,
      table.userId,
    ),

    index("team_members_team_id_idx").on(table.teamId),

    index("team_members_user_id_idx").on(table.userId),

    check(
      "team_members_role_check",
      sql`${table.role} IN ('owner', 'member')`,
    ),
  ],
);
