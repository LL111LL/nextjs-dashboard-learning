"use client";

import { useActionState } from "react";

import {
  updateProjectStatus,
  type UpdateProjectStatusState,
} from "@/app/lib/project-actions";

type ProjectStatus =
  | "active"
  | "completed"
  | "archived";

type ProjectStatusActionsProps = {
  teamId: string;
  projectId: string;
  currentStatus: string;
};

type StatusButtonProps = {
  teamId: string;
  projectId: string;
  targetStatus: ProjectStatus;
  label: string;
  className: string;
};

const initialState: UpdateProjectStatusState = {
  success: false,
  message: null,
};

function StatusButton({
  teamId,
  projectId,
  targetStatus,
  label,
  className,
}: StatusButtonProps) {
  const updateStatusWithValues =
    updateProjectStatus.bind(
      null,
      teamId,
      projectId,
      targetStatus,
    );

  const [state, formAction, isPending] =
    useActionState(
      updateStatusWithValues,
      initialState,
    );

  return (
    <div>
      <form action={formAction}>
        <button
          type="submit"
          disabled={isPending}
          aria-disabled={isPending}
          className={className}
        >
          {isPending ? "处理中……" : label}
        </button>
      </form>

      {state.message && !state.success && (
        <p
          aria-live="polite"
          className="mt-1 text-xs text-red-500"
        >
          {state.message}
        </p>
      )}
    </div>
  );
}

export default function ProjectStatusActions({
  teamId,
  projectId,
  currentStatus,
}: ProjectStatusActionsProps) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
      {currentStatus !== "active" && (
        <StatusButton
          teamId={teamId}
          projectId={projectId}
          targetStatus="active"
          label="恢复进行中"
          className="rounded-md border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        />
      )}

      {currentStatus !== "completed" && (
        <StatusButton
          teamId={teamId}
          projectId={projectId}
          targetStatus="completed"
          label="标记为已完成"
          className="rounded-md border border-green-200 px-3 py-1.5 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
        />
      )}

      {currentStatus !== "archived" && (
        <StatusButton
          teamId={teamId}
          projectId={projectId}
          targetStatus="archived"
          label="归档"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        />
      )}
    </div>
  );
}