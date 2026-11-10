import type { Metadata } from "next";
import {
  and,
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
  teamMembers,
  teams,
  users,
} from "@/app/db/schema";
import { auth } from "@/auth";

import CreateProjectForm from "./create-project-form";
import ProjectStatusActions from "./project-status-actions";
import DeleteProjectButton from "./delete-project-button";

export const metadata: Metadata = {
  title: "团队项目",
};

type TeamProjectsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function TeamProjects({
  params,
}: TeamProjectsPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    notFound();
  }

  const idResult = z.string().uuid().safeParse(id);

  if (!idResult.success) {
    notFound();
  }

  const teamId = idResult.data;

  // 同时验证团队存在，并且当前用户属于该团队。
  const [membership] = await db
    .select({
      teamName: teams.name,
      role: teamMembers.role,
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

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      createdAt: projects.createdAt,
      creatorName: users.name,
    })
    .from(projects)
    .leftJoin(
      users,
      eq(projects.createdBy, users.id),
    )
    .where(eq(projects.teamId, teamId))
    .orderBy(desc(projects.createdAt));

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

        <span className="text-zinc-900">
          项目
        </span>
      </nav>

      <div>
        <h1 className="text-3xl font-bold">
          团队项目
        </h1>

        <p className="mt-2 text-zinc-600">
          为“{membership.teamName}”创建和管理项目。
        </p>
      </div>

      <CreateProjectForm teamId={teamId} />

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">
            项目列表
          </h2>

          <span className="text-sm text-zinc-500">
            共 {rows.length} 个
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">
            该团队还没有项目。
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((project) => (
              <article
                key={project.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
<div className="flex items-start justify-between gap-3">
  <h3 className="font-semibold text-zinc-900">
    {project.name}
  </h3>

  <div className="flex shrink-0 flex-col items-end gap-2">
    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
      {project.status === "active"
        ? "进行中"
        : project.status === "completed"
          ? "已完成"
          : "已归档"}
    </span>

    <Link
      href={`/dashboard/teams/${teamId}/projects/${project.id}/edit`}
      className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline"
    >
      编辑项目
    </Link>
    {membership.role === "owner" && (
    <DeleteProjectButton
        teamId={teamId}
        projectId={project.id}
        projectName={project.name}
    />
    )}
  </div>
</div>

                <p className="mt-3 min-h-12 text-sm text-zinc-600">
                  {project.description ??
                    "暂无项目说明。"}
                </p>

                <div className="mt-4 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
                  <p>
                    创建者：
                    {project.creatorName ??
                      "已删除用户"}
                  </p>

                  <p className="mt-1">
                    创建时间：
                    {new Intl.DateTimeFormat(
                      "zh-CN",
                      {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone:
                          "Asia/Shanghai",
                      },
                    ).format(project.createdAt)}
                  </p>
                </div>
                <ProjectStatusActions
                    teamId={teamId}
                    projectId={project.id}
                    currentStatus={project.status}
                    />
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function TeamProjectsSkeleton() {
  return (
    <div className="h-96 animate-pulse rounded-xl bg-zinc-200" />
  );
}

export default function TeamProjectsPage(
  props: TeamProjectsPageProps,
) {
  return (
    <main className="p-8">
      <Suspense fallback={<TeamProjectsSkeleton />}>
        <TeamProjects params={props.params} />
      </Suspense>
    </main>
  );
}