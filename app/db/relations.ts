import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	customers: {
		user: r.one.users({
			from: r.customers.ownerId,
			to: r.users.id,
			alias: "customers_ownerId_users_id"
		}),
		users: r.many.users({
			from: r.customers.id.through(r.invoices.customerId),
			to: r.users.id.through(r.invoices.userId),
			alias: "customers_id_users_id_via_invoices"
		}),
		invoices: r.many.invoices(),
	},
	users: {
		customersOwnerId: r.many.customers({
			alias: "customers_ownerId_users_id"
		}),
		customersViaInvoices: r.many.customers({
			alias: "customers_id_users_id_via_invoices"
		}),
		invoices: r.many.invoices(),
	},
	invoices: {
		customer: r.one.customers({
			from: r.invoices.customerId,
			to: r.customers.id
		}),
		user: r.one.users({
			from: r.invoices.userId,
			to: r.users.id
		}),
	},
}))