import type { Metadata } from "next";
import {
  and,
  asc,
  desc,
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

import CreateTaskForm from "./create-task-form";

export const metadata: Metadata = {
  title: "项目详情",
};

type ProjectPageProps = {
  params: Promise<{
    id: string;
    projectId: string;
  }>;
};

async function ProjectDetails({
  params,
}: ProjectPageProps) {
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

  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(
      and(
        eq(projects.id, validProjectId),
        eq(projects.teamId, teamId),
      ),
    )
    .limit(1);

  if (!project) {
    notFound();
  }

  const [members, tasks] = await Promise.all([
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

    db
      .select({
        id: projectTasks.id,
        title: projectTasks.title,
        description: projectTasks.description,
        status: projectTasks.status,
        dueDate: projectTasks.dueDate,
        createdAt: projectTasks.createdAt,
        assigneeName: users.name,
        assigneeEmail: users.email,
      })
      .from(projectTasks)
      .innerJoin(
        projects,
        eq(projectTasks.projectId, projects.id),
      )
      .leftJoin(
        users,
        eq(projectTasks.assigneeId, users.id),
      )
      .where(
        and(
          eq(
            projectTasks.projectId,
            validProjectId,
          ),
          eq(projects.teamId, teamId),
        ),
      )
      .orderBy(desc(projectTasks.createdAt)),
  ]);

  const projectStatusLabel =
    project.status === "active"
      ? "进行中"
      : project.status === "completed"
        ? "已完成"
        : "已归档";

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
          {project.name}
        </span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {project.name}
          </h1>

          <p className="mt-2 max-w-3xl text-zinc-600">
            {project.description ??
              "暂无项目说明。"}
          </p>
        </div>

        <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
          {projectStatusLabel}
        </span>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">
          创建任务
        </h2>

        <p className="mt-2 text-sm text-zinc-600">
          创建任务并选择团队成员作为负责人。
        </p>

        <CreateTaskForm
          teamId={teamId}
          projectId={validProjectId}
          members={members}
        />
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">
            任务列表
          </h2>

          <span className="text-sm text-zinc-500">
            共 {tasks.length} 个
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">
            该项目还没有任务。
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {tasks.map((task) => {
              const statusLabel =
                task.status === "todo"
                  ? "待处理"
                  : task.status === "in_progress"
                    ? "进行中"
                    : "已完成";

              return (
                <article
                  key={task.id}
                  className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-zinc-900">
                      {task.title}
                    </h3>

                    <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                      {statusLabel}
                    </span>
                  </div>

                  <p className="mt-3 min-h-12 text-sm text-zinc-600">
                    {task.description ??
                      "暂无任务说明。"}
                  </p>

                  <dl className="mt-4 grid gap-2 border-t border-zinc-100 pt-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-zinc-500">
                        负责人
                      </dt>

                      <dd className="text-right text-zinc-700">
                        {task.assigneeName ??
                          task.assigneeEmail ??
                          "暂未分配"}
                      </dd>
                    </div>

                    <div className="flex justify-between gap-4">
                      <dt className="text-zinc-500">
                        截止日期
                      </dt>

                      <dd className="text-right text-zinc-700">
                        {task.dueDate ??
                          "未设置"}
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function ProjectDetailsSkeleton() {
  return (
    <div className="h-96 animate-pulse rounded-xl bg-zinc-200" />
  );
}

export default function ProjectPage(
  props: ProjectPageProps,
) {
  return (
    <main className="p-8">
      <Suspense fallback={<ProjectDetailsSkeleton />}>
        <ProjectDetails params={props.params} />
      </Suspense>
    </main>
  );
}