import { Suspense } from "react";
import Link from "next/link";
import { eq,sql } from "drizzle-orm";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { db } from "@/app/db";
import {
  teamInvitations,
  teams,
  users,
} from "@/app/db/schema";
import {
  hashInvitationToken,
} from "@/app/lib/invitation-token";
import AcceptInvitationForm from "./accept-invitation-form";

export const metadata: Metadata = {
  title: "团队邀请",
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

async function InvitationDetails({
  params,
}: InvitePageProps) {
  const { token } = await params;

  if (!/^[0-9a-f]{64}$/.test(token)) {
    return <p>邀请链接无效。</p>;
  }

  const session = await auth();

  // 未登录时先不展示团队和邀请邮箱。
  if (!session?.user?.id) {
    return (
      <div className="space-y-4">
        <p>请先登录被邀请邮箱对应的账号。</p>

        <Link
          href="/login"
          className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          前往登录
        </Link>

        <p className="text-sm text-zinc-600">
          尚无账号？请先注册。完成后重新打开原邀请链接。
        </p>

        <Link
          href="/register"
          className="inline-block text-blue-600 underline"
        >
          前往注册
        </Link>
      </div>
    );
  }

  const [invitation] = await db
    .select({
      teamName: teams.name,
      email: teamInvitations.email,
      expiresAt: teamInvitations.expiresAt,
      acceptedAt: teamInvitations.acceptedAt,
      revokedAt: teamInvitations.revokedAt,
      isExpired: sql<boolean>`
    ${teamInvitations.expiresAt} <= now()
    `,
    })
    .from(teamInvitations)
    .innerJoin(
      teams,
      eq(teamInvitations.teamId, teams.id),
    )
    .where(
      eq(
        teamInvitations.tokenHash,
        hashInvitationToken(token),
      ),
    )
    .limit(1);

  if (!invitation) {
    return <p>邀请不存在或已被删除。</p>;
  }

  if (invitation.revokedAt) {
    return <p>该邀请已被撤销。</p>;
  }

  if (invitation.acceptedAt) {
    return <p>该邀请已经被接受。</p>;
  }

 if (invitation.isExpired) {
    return <p>该邀请已过期，请联系团队所有者重新邀请。</p>;
  }

  // 使用数据库中的当前邮箱，不只依赖会话中的旧邮箱。
  const [currentUser] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (
    !currentUser ||
    currentUser.email.trim().toLowerCase() !==
      invitation.email.trim().toLowerCase()
  ) {
    return (
      <p>
        当前账号邮箱与邀请不匹配，请退出登录，
        再使用收到邀请的账号打开此链接。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p>
        你收到了加入
        <span className="mx-1 font-semibold">
          {invitation.teamName}
        </span>
        的邀请。
      </p>

      <p className="text-sm text-zinc-600">
        有效期至：
        {new Intl.DateTimeFormat("zh-CN", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Shanghai",
        }).format(invitation.expiresAt)}
      </p>

    <AcceptInvitationForm token={token} />
    </div>
  );
}

export default function InvitePage(
  props: InvitePageProps,
) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      <section className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold">
          团队邀请
        </h1>

        <Suspense fallback={<p>正在读取邀请……</p>}>
          <InvitationDetails {...props} />
        </Suspense>
      </section>
    </main>
  );
}