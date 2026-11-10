import type { Metadata } from "next";
import { and, asc, desc, eq, count,} from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import AddMemberForm from "./add-member-form";
import { db } from "@/app/db";
import {
  teamMembers,
  teams,
  users,
  activityLogs,
} from "@/app/db/schema";
import { auth } from "@/auth";
import RemoveMemberButton from "./remove-member-button";
import RenameTeamForm from "./rename-team-form";

export const metadata: Metadata = {
  title: "团队详情",
};

type TeamPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    activityPage?: string | string[];
  }>;
};

async function TeamDetails({
  params,
  searchParams,
}: TeamPageProps) {
  const session = await auth();
  const { id } = await params;
  const { activityPage: rawActivityPage } =
    await searchParams;

  const pageResult = z.coerce
    .number()
    .int()
    .positive()
    .safeParse(
      Array.isArray(rawActivityPage)
        ? rawActivityPage[0]
        : rawActivityPage,
    );

  const requestedActivityPage =
    pageResult.success ? pageResult.data : 1;

  if (!session?.user?.id) {
    notFound();
  }

  const idResult = z.string().uuid().safeParse(id);

  if (!idResult.success) {
    notFound();
  }

  const teamId = idResult.data;

  const [membership] = await db
    .select({
      teamId: teams.id,
      teamName: teams.name,
      role: teamMembers.role,
      createdAt: teams.createdAt,
    })
    .from(teamMembers)
    .innerJoin(
      teams,
      eq(teamMembers.teamId, teams.id),
    )
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!membership) {
    notFound();
  }

  const members = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: teamMembers.role,
      joinedAt: teamMembers.joinedAt,
    })
    .from(teamMembers)
    .innerJoin(
      users,
      eq(teamMembers.userId, users.id),
    )
    .where(eq(teamMembers.teamId, teamId))
    .orderBy(
      asc(teamMembers.joinedAt),
      asc(users.name),
    );

const activityPageSize = 5;

const [logCountResult] = await db
  .select({
    value: count(),
  })
  .from(activityLogs)
  .where(eq(activityLogs.teamId, teamId));

const totalLogs = logCountResult.value;

const totalActivityPages = Math.max(
  1,
  Math.ceil(totalLogs / activityPageSize),
);

const currentActivityPage = Math.min(
  requestedActivityPage,
  totalActivityPages,
);

const logs = await db
  .select({
    id: activityLogs.id,
    action: activityLogs.action,
    details: activityLogs.details,
    createdAt: activityLogs.createdAt,
    userName: users.name,
    userEmail: users.email,
  })
  .from(activityLogs)
  .leftJoin(
    users,
    eq(activityLogs.userId, users.id),
  )
  .where(eq(activityLogs.teamId, teamId))
  .orderBy(desc(activityLogs.createdAt))
  .limit(activityPageSize)
  .offset(
    (currentActivityPage - 1) *
      activityPageSize,
  );

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

        <span className="text-zinc-900">
          {membership.teamName}
        </span>
      </nav>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {membership.teamName}
          </h1>

          <p className="mt-2 text-zinc-600">
            创建于{" "}
            {new Intl.DateTimeFormat("zh-CN", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Shanghai",
            }).format(membership.createdAt)}
          </p>
        </div>

<div className="flex flex-wrap items-center gap-3">
  <Link
    href={`/dashboard/teams/${teamId}/projects`}
    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
  >
    查看项目 →
  </Link>

  <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
    我的角色：
    {membership.role === "owner"
      ? "所有者"
      : "成员"}
  </span>
</div>
      </div>
{membership.role === "owner" && (
  <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
    <section className="min-w-0">
      <h2 className="text-xl font-semibold">
        团队设置
      </h2>

      <p className="mt-2 text-sm text-zinc-600">
        只有团队所有者可以修改团队名称。
      </p>

      <RenameTeamForm
        teamId={teamId}
        currentName={membership.teamName}
      />
    </section>

    <section className="min-w-0">
      <h2 className="text-xl font-semibold">
        添加成员
      </h2>

      <p className="mt-2 text-sm text-zinc-600">
        只能添加已经注册过账号的用户。
      </p>

      <AddMemberForm teamId={teamId} />
    </section>
  </div>
)}

      <section className="mt-8">
        <h2 className="text-xl font-semibold">
          团队成员
        </h2>

        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full text-left">
            <thead className="bg-zinc-50 text-sm text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">
                  姓名
                </th>
                <th className="px-4 py-3 font-medium">
                  邮箱
                </th>
                <th className="px-4 py-3 font-medium">
                  角色
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  操作
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-3 font-medium">
                    {member.name}
                  </td>

                  <td className="px-4 py-3 text-zinc-600">
                    {member.email}
                  </td>

                  <td className="px-4 py-3">
                    {member.role === "owner"
                      ? "所有者"
                      : "成员"}
                  </td>
                  <td className="px-4 py-3 text-right">
                  {membership.role === "owner" &&
                  member.role === "member" ? (
                    <RemoveMemberButton
                      teamId={teamId}
                      memberUserId={member.id}
                      memberName={member.name}
                    />
                  ) : (
                    <span className="text-sm text-zinc-400">
                      —
                    </span>
                  )}
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
<section
  id="activity"
  className="mt-8 scroll-mt-6"
>
  <div className="flex items-center justify-between gap-4">
    <h2 className="text-xl font-semibold">
      最近活动
    </h2>

    <span className="text-sm text-zinc-500">
      共 {totalLogs} 条
    </span>
  </div>

  {logs.length === 0 ? (
    <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-6 text-zinc-500">
      暂无活动记录。
    </div>
  ) : (
    <>
    <ol className="mt-4 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      {logs.map((log) => (
        <li
          key={log.id}
          className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-zinc-900">
                {log.userName ??
                  log.userEmail ??
                  "已删除用户"}
              </span>

              <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
                {log.action}
              </span>
            </div>

            <p className="mt-1 text-sm text-zinc-600">
              {log.details ?? "执行了团队操作"}
            </p>
          </div>

          <time className="shrink-0 text-sm text-zinc-500">
            {new Intl.DateTimeFormat("zh-CN", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Shanghai",
            }).format(log.createdAt)}
          </time>
        </li>
      ))}
    </ol>
{totalActivityPages > 1 && (
  <nav
    aria-label="活动日志分页"
    className="mt-4 flex items-center justify-between gap-4"
  >
    {currentActivityPage > 1 ? (
      <Link
        href={`/dashboard/teams/${teamId}?activityPage=${
          currentActivityPage - 1
        }#activity`}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        ← 上一页
      </Link>
    ) : (
      <span className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-400">
        ← 上一页
      </span>
    )}

    <span className="text-sm text-zinc-600">
      第 {currentActivityPage} 页，共{" "}
      {totalActivityPages} 页
    </span>

    {currentActivityPage <
    totalActivityPages ? (
      <Link
        href={`/dashboard/teams/${teamId}?activityPage=${
          currentActivityPage + 1
        }#activity`}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        下一页 →
      </Link>
    ) : (
      <span className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-400">
        下一页 →
      </span>
    )}
  </nav>
)}
    </>
  )}

</section>
    </>
  );
}

function TeamDetailsSkeleton() {
  return (
    <div className="h-72 animate-pulse rounded-xl bg-zinc-200" />
  );
}

export default function TeamPage(
  props: TeamPageProps,
) {
  return (
    <main className="p-8">
      <Suspense fallback={<TeamDetailsSkeleton />}>
        <TeamDetails params={props.params}
          searchParams={props.searchParams}
        />
      </Suspense>
    </main>
  );
}