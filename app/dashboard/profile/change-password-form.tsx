"use client";

import {
  useActionState,
  useEffect,
  useRef,
} from "react";
import {
  changePassword,
  type ChangePasswordState,
} from "../../lib/profile-actions";

const initialState: ChangePasswordState = {
  success: false,
  message: null,
  errors: {},
};

export default function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] =
    useActionState(changePassword, initialState);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-6 space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold">
        修改密码
      </h2>

      <PasswordField
        id="currentPassword"
        name="currentPassword"
        label="当前密码"
        autoComplete="current-password"
        errors={state.errors?.currentPassword}
      />

      <PasswordField
        id="newPassword"
        name="newPassword"
        label="新密码"
        autoComplete="new-password"
        errors={state.errors?.newPassword}
      />

      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="确认新密码"
        autoComplete="new-password"
        errors={state.errors?.confirmPassword}
      />

      <button
        type="submit"
        disabled={isPending}
        aria-disabled={isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "正在修改……" : "修改密码"}
      </button>

      <div
        className="min-h-6"
        aria-live="polite"
        aria-atomic="true"
      >
        {state.message && (
          <p
            className={
              state.success
                ? "text-sm text-green-600"
                : "text-sm text-red-500"
            }
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

function PasswordField({
  id,
  name,
  label,
  autoComplete,
  errors,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete:
    | "current-password"
    | "new-password";
  errors?: string[];
}) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-zinc-700"
      >
        {label}
      </label>

      <input
        id={id}
        name={name}
        type="password"
        required
        minLength={id === "currentPassword" ? 1 : 8}
        autoComplete={autoComplete}
        aria-describedby={errorId}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
      />

      <div
        id={errorId}
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
    </div>
  );
}