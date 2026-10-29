"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { authenticate } from "../lib/actions";
import Link from "next/link";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl =
    searchParams.get("callbackUrl") || "/dashboard";

  const registered =
  searchParams.get("registered") === "1";

  const [errorMessage, formAction, isPending] =
    useActionState(authenticate, undefined);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl bg-white p-6 shadow-sm"
    >
      {registered && (
  <div
    className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700"
    role="status"
  >
    注册成功，请使用新账号登录。
  </div>
)}
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          电子邮箱
        </label>

        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="请输入电子邮箱"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          密码
        </label>

        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          placeholder="请输入密码"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
        />
      </div>

      <input
        type="hidden"
        name="redirectTo"
        value={callbackUrl}
      />

      <button
        type="submit"
        disabled={isPending}
        aria-disabled={isPending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "正在登录……" : "登录"}
      </button>

      <div
        className="min-h-6"
        aria-live="polite"
        aria-atomic="true"
      >
        {errorMessage && (
          <p className="text-sm text-red-500">
            {errorMessage}
          </p>
        )}
      </div>
      <p className="text-center text-sm text-zinc-600">
        还没有账号？{" "}
        <Link
          href="/register"
          className="font-medium text-blue-600 hover:underline"
        >
          创建账号
        </Link>
      </p>
    </form>
  );
}