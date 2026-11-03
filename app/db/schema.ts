import { pgTable, uuid, varchar, integer, text, date, index, foreignKey,  unique, check } from "drizzle-orm/pg-core"
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
