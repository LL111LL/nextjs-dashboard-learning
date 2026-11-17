"use client";

import { useActionState } from "react";

import {
  createTeamInvitation,
  type CreateInvitationState,
} from "@/app/lib/invitation-actions";

const initialState: CreateInvitationState = {};

export default function InviteMemberForm({
  teamId,
}: {
  teamId: string;
}) {
  const action = createTeamInvitation.bind(
    null,
    teamId,
  );

  const [state, formAction, pending] =
    useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="mt-4 space-y-4"
    >
      <div>
        <label
          htmlFor="invitation-email"
          className="block text-sm font-medium"
        >
          被邀请人的邮箱
        </label>

        <input
          id="invitation-email"
          name="email"
          type="email"
          required
          maxLength={255}
          autoComplete="off"
          aria-describedby="invitation-email-errors"
          className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2"
          placeholder="例如：friend@example.com"
        />

        <div
          id="invitation-email-errors"
          className="mt-1 text-sm text-red-600"
        >
          {state.errors?.email?.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "正在生成…" : "生成邀请链接"}
      </button>

      <div aria-live="polite">
        {state.message && (
          <p
            className={
              state.success
                ? "text-sm text-green-700"
                : "text-sm text-red-600"
            }
          >
            {state.message}
          </p>
        )}

        {state.success && state.invitationPath && (
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm font-medium">
              邀请路径，7 天内有效：
            </p>

            <code className="mt-2 block break-all text-sm">
              {state.invitationPath}
            </code>

            <p className="mt-2 text-xs text-zinc-600">
              请妥善保管，不要公开分享。
              接受邀请页面将在下一步实现。
            </p>
          </div>
        )}
      </div>
    </form>
  );
}