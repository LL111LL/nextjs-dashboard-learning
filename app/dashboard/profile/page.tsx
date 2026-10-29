import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/auth";
import ChangePasswordForm from "./change-password-form";

export const metadata: Metadata = {
  title: "个人资料",
};

async function ProfileDetails() {
  const session = await auth();

  if (!session?.user) {
    return (
      <p className="text-red-600">
        无法读取登录用户。
      </p>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <dl className="space-y-5">
        <div>
          <dt className="text-sm font-medium text-zinc-500">
            姓名
          </dt>
          <dd className="mt-1 text-lg text-zinc-900">
            {session.user.name || "未设置"}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-zinc-500">
            电子邮箱
          </dt>
          <dd className="mt-1 text-lg text-zinc-900">
            {session.user.email || "未设置"}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-zinc-500">
            用户 ID
          </dt>
          <dd className="mt-1 break-all font-mono text-sm text-zinc-700">
            {session.user.id || "未提供"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">个人资料</h1>
      <p className="mt-2 text-zinc-600">
        以下信息来自当前登录会话。
      </p>

      <Suspense
        fallback={
          <div className="mt-6 h-56 animate-pulse rounded-xl bg-zinc-200" />
        }
      >
        <ProfileDetails />
      </Suspense>
      <ChangePasswordForm />
    </main>
  );
}