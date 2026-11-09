import type { Metadata } from "next";
import { and, asc, eq } from "drizzle-orm";
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
} from "@/app/db/schema";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "团队详情",
};

type TeamPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function TeamDetails({
  params,
}: TeamPageProps) {
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

        <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
          我的角色：
          {membership.role === "owner"
            ? "所有者"
            : "成员"}
        </span>
      </div>
{membership.role === "owner" && (
  <section className="mt-8">
    <h2 className="text-xl font-semibold">
      添加成员
    </h2>

    <p className="mt-2 text-sm text-zinc-600">
      只能添加已经注册过账号的用户。
    </p>

    <AddMemberForm teamId={teamId} />
  </section>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        <TeamDetails params={props.params} />
      </Suspense>
    </main>
  );
}