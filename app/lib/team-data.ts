import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/app/db";
import { teamMembers, teams } from "@/app/db/schema";
import { auth } from "@/auth";

export async function getMyTeams() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, reason: "unauthenticated" } as const;
  }

  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      role: teamMembers.role,
      createdAt: teams.createdAt,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, userId))
    .orderBy(desc(teams.createdAt));

  return { ok: true, rows } as const;
}