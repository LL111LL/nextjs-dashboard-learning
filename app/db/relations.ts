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

		activityLogs: r.many.activityLogs({
		alias: "activityLogs_userId_users_id",
		}),

		projectsCreated: r.many.projects({
		alias: "projects_createdBy_users_id",
		}),

		assignedTasks: r.many.projectTasks({
		alias: "projectTasks_assigneeId_users_id",
		}),

		createdTasks: r.many.projectTasks({
		alias: "projectTasks_createdBy_users_id",
		}),
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

		activityLogs: r.many.activityLogs({
			alias: "activityLogs_teamId_teams_id",
		}),

		projects: r.many.projects({
		alias: "projects_teamId_teams_id",
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
	activityLogs: {
		team: r.one.teams({
			from: r.activityLogs.teamId,
			to: r.teams.id,
			alias: "activityLogs_teamId_teams_id",
		}),

		user: r.one.users({
			from: r.activityLogs.userId,
			to: r.users.id,
			alias: "activityLogs_userId_users_id",
		}),
		},

		projects: {
			team: r.one.teams({
				from: r.projects.teamId,
				to: r.teams.id,
				alias: "projects_teamId_teams_id",
			}),

			creator: r.one.users({
				from: r.projects.createdBy,
				to: r.users.id,
				alias: "projects_createdBy_users_id",
			}),

			tasks: r.many.projectTasks({
			alias: "projectTasks_projectId_projects_id",
			}),
			},

			projectTasks: {
			project: r.one.projects({
				from: r.projectTasks.projectId,
				to: r.projects.id,
				alias: "projectTasks_projectId_projects_id",
			}),

			assignee: r.one.users({
				from: r.projectTasks.assigneeId,
				to: r.users.id,
				alias: "projectTasks_assigneeId_users_id",
			}),

			creator: r.one.users({
				from: r.projectTasks.createdBy,
				to: r.users.id,
				alias: "projectTasks_createdBy_users_id",
			}),
			},
}))