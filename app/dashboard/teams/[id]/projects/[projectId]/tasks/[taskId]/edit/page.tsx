import type { Metadata } from "next";
import {
  and,
  asc,
  eq,
} from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { db } from "@/app/db";
import {
  projects,
  projectTasks,
  teamMembers,
  teams,
  users,
} from "@/app/db/schema";
import { auth } from "@/auth";

import EditTaskForm from "./edit-task-form";

export const metadata: Metadata = {
  title: "编辑任务",
};

type EditTaskPageProps = {
  params: Promise<{
    id: string;
    projectId: string;
    taskId: string;
  }>;
};

async function EditTaskWithData({
  params,
}: EditTaskPageProps) {
  const session = await auth();
  const { id, projectId, taskId } =
    await params;

  if (!session?.user?.id) {
    notFound();
  }

  const idsResult = z
    .object({
      teamId: z.string().uuid(),
      projectId: z.string().uuid(),
      taskId: z.string().uuid(),
    })
    .safeParse({
      teamId: id,
      projectId,
      taskId,
    });

  if (!idsResult.success) {
    notFound();
  }

  const {
    teamId,
    projectId: validProjectId,
    taskId: validTaskId,
  } = idsResult.data;

  const [membership] = await db
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
    .limit(1);

  if (!membership) {
    notFound();
  }

  const [task, members] = await Promise.all([
    db
      .select({
        id: projectTasks.id,
        title: projectTasks.title,
        description: projectTasks.description,
        assigneeId: projectTasks.assigneeId,
        dueDate: projectTasks.dueDate,
        projectName: projects.name,
      })
      .from(projectTasks)
      .innerJoin(
        projects,
        eq(projectTasks.projectId, projects.id),
      )
      .where(
        and(
          eq(projectTasks.id, validTaskId),
          eq(
            projectTasks.projectId,
            validProjectId,
          ),
          eq(projects.teamId, teamId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]),

    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(teamMembers)
      .innerJoin(
        users,
        eq(teamMembers.userId, users.id),
      )
      .where(eq(teamMembers.teamId, teamId))
      .orderBy(asc(users.name)),
  ]);

  if (!task) {
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

        <Link
          href={`/dashboard/teams/${teamId}/projects/${validProjectId}`}
          className="hover:text-blue-600"
        >
          {task.projectName}
        </Link>

        <span className="mx-2">/</span>

        <span className="text-zinc-900">
          编辑任务
        </span>
      </nav>

      <h1 className="text-3xl font-bold">
        编辑任务
      </h1>

      <p className="mt-2 text-zinc-600">
        修改“{task.title}”的内容、负责人和截止日期。
      </p>

      <EditTaskForm
        teamId={teamId}
        projectId={validProjectId}
        task={task}
        members={members}
      />
    </>
  );
}

function EditTaskSkeleton() {
  return (
    <div className="h-96 animate-pulse rounded-xl bg-zinc-200" />
  );
}

export default function EditTaskPage(
  props: EditTaskPageProps,
) {
  return (
    <main className="p-8">
      <Suspense fallback={<EditTaskSkeleton />}>
        <EditTaskWithData
          params={props.params}
        />
      </Suspense>
    </main>
  );
}