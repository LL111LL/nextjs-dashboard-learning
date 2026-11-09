"use client";

import { useActionState } from "react";

import {
  removeTeamMember,
  type RemoveTeamMemberState,
} from "@/app/lib/team-actions";

const initialState: RemoveTeamMemberState = {
  success: false,
  message: null,
};

type RemoveMemberButtonProps = {
  teamId: string;
  memberUserId: string;
  memberName: string;
};

export default function RemoveMemberButton({
  teamId,
  memberUserId,
  memberName,
}: RemoveMemberButtonProps) {
  const removeMemberWithIds =
    removeTeamMember.bind(
      null,
      teamId,
      memberUserId,
    );

  const [state, formAction, isPending] =
    useActionState(
      removeMemberWithIds,
      initialState,
    );

  return (
    <div className="flex flex-col items-end gap-1">
      <form
        action={formAction}
        onSubmit={(event) => {
          const confirmed = window.confirm(
            `确定要将“${memberName}”移出团队吗？`,
          );

          if (!confirmed) {
            event.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={isPending}
          aria-disabled={isPending}
          className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "正在移除……" : "移除"}
        </button>
      </form>

      {state.message && !state.success && (
        <p
          aria-live="polite"
          className="max-w-52 text-right text-xs text-red-500"
        >
          {state.message}
        </p>
      )}
    </div>
  );
}