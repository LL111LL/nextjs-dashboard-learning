"use client";

import { useActionState } from "react";

import {
  addTeamMember,
  type AddTeamMemberState,
} from "@/app/lib/team-actions";

const initialState: AddTeamMemberState = {
  success: false,
  errors: {},
  message: null,
};

type AddMemberFormProps = {
  teamId: string;
};

export default function AddMemberForm({
  teamId,
}: AddMemberFormProps) {
  const addMemberWithTeamId =
    addTeamMember.bind(null, teamId);

  const [state, formAction, isPending] =
    useActionState(
      addMemberWithTeamId,
      initialState,
    );

  return (
    <form
      action={formAction}
      className="mt-4 max-w-2xl space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <div>
        <label
          htmlFor="member-email"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          已注册用户的邮箱
        </label>

        <input
          id="member-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-describedby="member-email-error"
          placeholder="member@example.com"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
        />

        <div
          id="member-email-error"
          aria-live="polite"
          aria-atomic="true"
        >
          {state.errors?.email?.map((error) => (
            <p
              key={error}
              className="mt-2 text-sm text-red-500"
            >
              {error}
            </p>
          ))}
        </div>
      </div>

      <div
        aria-live="polite"
        aria-atomic="true"
        className="min-h-6"
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

      <button
        type="submit"
        disabled={isPending}
        aria-disabled={isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending
          ? "正在添加……"
          : "添加成员"}
      </button>
    </form>
  );
}