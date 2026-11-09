"use client";

import { useActionState } from "react";

import {
  createTeam,
  type TeamActionState,
} from "@/app/lib/team-actions";

const initialState: TeamActionState = {
  success: false,
  errors: {},
  message: null,
};

export default function CreateTeamForm() {
  const [state, formAction, isPending] =
    useActionState(createTeam, initialState);

  return (
    <form
      action={formAction}
      className="mt-6 max-w-2xl space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          团队名称
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          autoComplete="organization"
          aria-describedby="name-error"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
        />

        <div
          id="name-error"
          aria-live="polite"
          aria-atomic="true"
        >
          {state.errors?.name?.map((error) => (
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
        {isPending ? "正在创建……" : "创建团队"}
      </button>
    </form>
  );
}