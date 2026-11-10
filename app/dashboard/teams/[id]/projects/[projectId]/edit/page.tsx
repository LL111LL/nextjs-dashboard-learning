import type { Metadata } from "next";
import {
  and,
  eq,
} from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { db } from "@/app/db";
import {
  projects,
  teamMembers,
  teams,
} from "@/app/db/schema";
import { auth } from "@/auth";

import EditProjectForm from "./edit-project-form";

export const metadata: Metadata = {
  title: "编辑项目",
};

type EditProjectPageProps = {
  params: Promise<{
    id: string;
    projectId: string;
  }>;
};

async function EditProjectWithData({
  params,
}: EditProjectPageProps) {
  const session = await auth();
  const { id, projectId } = await params;

  if (!session?.user?.id) {
    notFound();
  }

  const idsResult = z
    .object({
      teamId: z.string().uuid(),
      projectId: z.string().uuid(),
    })
    .safeParse({
      teamId: id,
      projectId,
    });

  if (!idsResult.success) {
    notFound();
  }

  const {
    teamId,
    projectId: validProjectId,
  } = idsResult.data;

  const [membership, project] =
    await Promise.all([
      db
        .select({
          teamName: teams.name,
        })
        .from(teamMembers)
        .innerJoin(
          teams,
          eq(teamMembers.teamId, teams.id),
        )
        .where(
          and(
            eq(teamMembers.teamId, teamId),
            eq(
              teamMembers.userId,
              session.user.id,
            ),
          ),
        )
        .limit(1)
        .then((rows) => rows[0]),

      db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
        })
        .from(projects)
        .where(
          and(
            eq(projects.id, validProjectId),
            eq(projects.teamId, teamId),
          ),
        )
        .limit(1)
        .then((rows) => rows[0]),
    ]);

  if (!membership || !project) {
    notFound();
  }

  return (
    <>
      <nav className="mb-6 text-sm text-zinc-500">
        <Link
          href="/dashboard/teams"
          className="hover:text-blue-600"
        >
          团队
        </Link>

        <span className="mx-2">/</span>

        <Link
          href={`/dashboard/teams/${teamId}`}
          className="hover:text-blue-600"
        >
          {membership.teamName}
        </Link>

        <span className="mx-2">/</span>

        <Link
          href={`/dashboard/teams/${teamId}/projects`}
          className="hover:text-blue-600"
        >
          项目
        </Link>

        <span className="mx-2">/</span>

        <span className="text-zinc-900">
          编辑
        </span>
      </nav>

      <h1 className="text-3xl font-bold">
        编辑项目
      </h1>

      <p className="mt-2 text-zinc-600">
        修改“{project.name}”的名称和说明。
      </p>

      <EditProjectForm
        teamId={teamId}
        project={project}
      />
    </>
  );
}

function EditProjectSkeleton() {
  return (
    <div className="h-96 animate-pulse rounded-xl bg-zinc-200" />
  );
}

export default function EditProjectPage(
  props: EditProjectPageProps,
) {
  return (
    <main className="p-8">
      <Suspense fallback={<EditProjectSkeleton />}>
        <EditProjectWithData
          params={props.params}
        />
      </Suspense>
    </main>
  );
}