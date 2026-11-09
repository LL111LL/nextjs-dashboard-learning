"use client";

import { useActionState } from "react";

import {
  updateTeamName,
  type UpdateTeamNameState,
} from "@/app/lib/team-actions";

const initialState: UpdateTeamNameState = {
  success: false,
  errors: {},
  message: null,
};

type RenameTeamFormProps = {
  teamId: string;
  currentName: string;
};

export default function RenameTeamForm({
  teamId,
  currentName,
}: RenameTeamFormProps) {
  const updateTeamNameWithId =
    updateTeamName.bind(null, teamId);

  const [state, formAction, isPending] =
    useActionState(
      updateTeamNameWithId,
      initialState,
    );

  return (
    <form
      action={formAction}
      className="mt-4 max-w-2xl space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <div>
        <label
          htmlFor="team-name"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          团队名称
        </label>

        <input
          id="team-name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          defaultValue={currentName}
          autoComplete="organization"
          aria-describedby="team-name-error"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
        />

        <div
          id="team-name-error"
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
        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending
          ? "正在保存……"
          : "保存团队名称"}
      </button>
    </form>
  );
}