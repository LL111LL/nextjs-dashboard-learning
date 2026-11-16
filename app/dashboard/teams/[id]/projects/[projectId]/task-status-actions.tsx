"use client";

import { useActionState } from "react";

import {
  updateTaskStatus,
  type UpdateTaskStatusState,
} from "@/app/lib/task-actions";

type TaskStatus =
  | "todo"
  | "in_progress"
  | "done";

type TaskStatusActionsProps = {
  teamId: string;
  projectId: string;
  taskId: string;
  currentStatus: string;
};

type StatusButtonProps = {
  teamId: string;
  projectId: string;
  taskId: string;
  targetStatus: TaskStatus;
  label: string;
  className: string;
};

const initialState: UpdateTaskStatusState = {
  success: false,
  message: null,
};

function StatusButton({
  teamId,
  projectId,
  taskId,
  targetStatus,
  label,
  className,
}: StatusButtonProps) {
  const updateStatusWithValues =
    updateTaskStatus.bind(
      null,
      teamId,
      projectId,
      taskId,
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

export default function TaskStatusActions({
  teamId,
  projectId,
  taskId,
  currentStatus,
}: TaskStatusActionsProps) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
      {currentStatus !== "todo" && (
        <StatusButton
          teamId={teamId}
          projectId={projectId}
          taskId={taskId}
          targetStatus="todo"
          label="改为待处理"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        />
      )}

      {currentStatus !== "in_progress" && (
        <StatusButton
          teamId={teamId}
          projectId={projectId}
          taskId={taskId}
          targetStatus="in_progress"
          label="开始处理"
          className="rounded-md border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        />
      )}

      {currentStatus !== "done" && (
        <StatusButton
          teamId={teamId}
          projectId={projectId}
          taskId={taskId}
          targetStatus="done"
          label="标记为已完成"
          className="rounded-md border border-green-200 px-3 py-1.5 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
        />
      )}
    </div>
  );
}