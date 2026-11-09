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
		teamsCreated: r.many.teams({
		alias: "teams_createdBy_users_id",
		}),

		teamMemberships: r.many.teamMembers({
		alias: "teamMembers_userId_users_id",
		}),
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
	teams: {
		creator: r.one.users({
			from: r.teams.createdBy,
			to: r.users.id,
			alias: "teams_createdBy_users_id",
		}),

		members: r.many.teamMembers({
			alias: "teamMembers_teamId_teams_id",
		}),
		},

	teamMembers: {
		team: r.one.teams({
			from: r.teamMembers.teamId,
			to: r.teams.id,
			alias: "teamMembers_teamId_teams_id",
		}),

		user: r.one.users({
			from: r.teamMembers.userId,
			to: r.users.id,
			alias: "teamMembers_userId_users_id",
		}),
		},
}))