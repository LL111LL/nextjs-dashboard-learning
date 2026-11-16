"use client";

import { useActionState } from "react";

import {
  deleteTask,
  type DeleteTaskState,
} from "@/app/lib/task-actions";

const initialState: DeleteTaskState = {
  success: false,
  message: null,
};

type DeleteTaskButtonProps = {
  teamId: string;
  projectId: string;
  taskId: string;
  taskTitle: string;
};

export default function DeleteTaskButton({
  teamId,
  projectId,
  taskId,
  taskTitle,
}: DeleteTaskButtonProps) {
  const deleteTaskWithIds =
    deleteTask.bind(
      null,
      teamId,
      projectId,
      taskId,
    );

  const [state, formAction, isPending] =
    useActionState(
      deleteTaskWithIds,
      initialState,
    );

  return (
    <div className="flex flex-col items-end">
      <form
        action={formAction}
        onSubmit={(event) => {
          const confirmed = window.confirm(
            `确定要删除任务“${taskTitle}”吗？此操作无法撤销。`,
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
          className="text-sm font-medium text-red-600 hover:text-red-500 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "正在删除……" : "删除任务"}
        </button>
      </form>

      {state.message && !state.success && (
        <p
          aria-live="polite"
          className="mt-1 max-w-52 text-right text-xs text-red-500"
        >
          {state.message}
        </p>
      )}
    </div>
  );
}