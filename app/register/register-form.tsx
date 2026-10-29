"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  registerUser,
  type RegisterState,
} from "../lib/register-actions";

const initialState: RegisterState = {
  message: null,
  errors: {},
};

export default function RegisterForm() {
  const [state, formAction, isPending] =
    useActionState(registerUser, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl bg-white p-6 shadow-sm"
    >
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          姓名
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          aria-describedby="name-error"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
        />

        <FieldErrors
          id="name-error"
          errors={state.errors?.name}
        />
      </div>

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
          aria-describedby="email-error"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
        />

        <FieldErrors
          id="email-error"
          errors={state.errors?.email}
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
          minLength={8}
          autoComplete="new-password"
          aria-describedby="password-error"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
        />

        <FieldErrors
          id="password-error"
          errors={state.errors?.password}
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          确认密码
        </label>

        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          aria-describedby="confirm-password-error"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
        />

        <FieldErrors
          id="confirm-password-error"
          errors={state.errors?.confirmPassword}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        aria-disabled={isPending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "正在注册……" : "注册"}
      </button>

      <div
        className="min-h-6"
        aria-live="polite"
        aria-atomic="true"
      >
        {state.message && (
          <p className="text-sm text-red-500">
            {state.message}
          </p>
        )}
      </div>

      <p className="text-center text-sm text-zinc-600">
        已经有账号？{" "}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:underline"
        >
          返回登录
        </Link>
      </p>
    </form>
  );
}

function FieldErrors({
  id,
  errors,
}: {
  id: string;
  errors?: string[];
}) {
  return (
    <div
      id={id}
      aria-live="polite"
      aria-atomic="true"
    >
      {errors?.map((error) => (
        <p
          className="mt-2 text-sm text-red-500"
          key={error}
        >
          {error}
        </p>
      ))}
    </div>
  );
}