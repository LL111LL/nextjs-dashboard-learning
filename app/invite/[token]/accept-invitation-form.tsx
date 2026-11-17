"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  acceptTeamInvitation,
  type AcceptInvitationState,
} from "@/app/lib/invitation-actions";

const initialState: AcceptInvitationState = {};

export default function AcceptInvitationForm({
  token,
}: {
  token: string;
}) {
  const action = acceptTeamInvitation.bind(
    null,
    token,
  );

  const [state, formAction, pending] =
    useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {!state.success && (
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "正在加入…" : "接受邀请"}
        </button>
      )}

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
      </div>

      {state.success && state.teamPath && (
        <Link
          href={state.teamPath}
          className="inline-block rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
        >
          进入团队 →
        </Link>
      )}
    </form>
  );
}