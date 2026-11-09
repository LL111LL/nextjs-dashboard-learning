import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { Suspense } from "react";

import { db } from "@/app/db";
import {
  teamMembers,
  teams,
} from "@/app/db/schema";
import { auth } from "@/auth";

import CreateTeamForm from "./create-team-form";

export const metadata: Metadata = {
  title: "团队",
};

async function TeamsList() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <p className="mt-6 text-red-500">
        登录状态已失效，请重新登录。
      </p>
    );
  }

  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      role: teamMembers.role,
      createdAt: teams.createdAt,
    })
    .from(teamMembers)
    .innerJoin(
      teams,
      eq(teamMembers.teamId, teams.id),
    )
    .where(
      eq(teamMembers.userId, session.user.id),
    )
    .orderBy(desc(teams.createdAt));

  if (rows.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">
        你还没有加入任何团队。
      </div>
    );
  }

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full text-left">
        <thead className="bg-zinc-50 text-sm text-zinc-600">
          <tr>
            <th className="px-4 py-3 font-medium">
              团队名称
            </th>

            <th className="px-4 py-3 font-medium">
              我的角色
            </th>

            <th className="px-4 py-3 font-medium">
              创建时间
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-zinc-100">
          {rows.map((team) => (
            <tr key={team.id}>
              <td className="px-4 py-3 font-medium text-zinc-900">
                {team.name}
              </td>

              <td className="px-4 py-3">
                <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                  {team.role === "owner"
                    ? "所有者"
                    : "成员"}
                </span>
              </td>

              <td className="px-4 py-3 text-sm text-zinc-600">
                {new Intl.DateTimeFormat("zh-CN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Shanghai",
                }).format(team.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamsListSkeleton() {
  return (
    <div className="mt-8 h-40 animate-pulse rounded-xl bg-zinc-200" />
  );
}

export default function TeamsPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">
        团队管理
      </h1>

      <p className="mt-2 text-zinc-600">
        创建团队并管理当前账号所属的团队。
      </p>

      <CreateTeamForm />

      <Suspense fallback={<TeamsListSkeleton />}>
        <TeamsList />
      </Suspense>
    </main>
  );
}