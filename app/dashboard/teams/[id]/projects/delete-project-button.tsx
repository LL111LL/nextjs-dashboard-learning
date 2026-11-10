"use client";

import { useActionState } from "react";

import {
  deleteProject,
  type DeleteProjectState,
} from "@/app/lib/project-actions";

const initialState: DeleteProjectState = {
  success: false,
  message: null,
};

type DeleteProjectButtonProps = {
  teamId: string;
  projectId: string;
  projectName: string;
};

export default function DeleteProjectButton({
  teamId,
  projectId,
  projectName,
}: DeleteProjectButtonProps) {
  const deleteProjectWithIds =
    deleteProject.bind(
      null,
      teamId,
      projectId,
    );

  const [state, formAction, isPending] =
    useActionState(
      deleteProjectWithIds,
      initialState,
    );

  return (
    <div className="flex flex-col items-end">
      <form
        action={formAction}
        onSubmit={(event) => {
          const confirmed = window.confirm(
            `确定要删除项目“${projectName}”吗？此操作无法撤销。`,
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
          {isPending ? "正在删除……" : "删除项目"}
        </button>
      </form>

      {state.message && !state.success && (
        <p
          aria-live="polite"
          className="mt-1 max-w-48 text-right text-xs text-red-500"
        >
          {state.message}
        </p>
      )}
    </div>
  );
}