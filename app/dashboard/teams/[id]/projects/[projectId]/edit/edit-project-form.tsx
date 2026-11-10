"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  updateProject,
  type UpdateProjectState,
} from "@/app/lib/project-actions";

type EditableProject = {
  id: string;
  name: string;
  description: string | null;
};

type EditProjectFormProps = {
  teamId: string;
  project: EditableProject;
};

const initialState: UpdateProjectState = {
  success: false,
  errors: {},
  message: null,
};

export default function EditProjectForm({
  teamId,
  project,
}: EditProjectFormProps) {
  const updateProjectWithIds =
    updateProject.bind(
      null,
      teamId,
      project.id,
    );

  const [state, formAction, isPending] =
    useActionState(
      updateProjectWithIds,
      initialState,
    );

  return (
    <form
      action={formAction}
      className="mt-6 max-w-3xl space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label
          htmlFor="project-name"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          项目名称
        </label>

        <input
          id="project-name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={150}
          defaultValue={project.name}
          aria-describedby="project-name-error"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
        />

        <div
          id="project-name-error"
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

      <div>
        <label
          htmlFor="project-description"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          项目说明
        </label>

        <textarea
          id="project-description"
          name="description"
          rows={6}
          maxLength={1000}
          defaultValue={project.description ?? ""}
          aria-describedby="project-description-error"
          className="w-full resize-y rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
        />

        <div
          id="project-description-error"
          aria-live="polite"
          aria-atomic="true"
        >
          {state.errors?.description?.map(
            (error) => (
              <p
                key={error}
                className="mt-2 text-sm text-red-500"
              >
                {error}
              </p>
            ),
          )}
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

      <div className="flex flex-wrap justify-end gap-3">
        <Link
          href={`/dashboard/teams/${teamId}/projects`}
          className="rounded-lg border border-zinc-300 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50"
        >
          返回项目列表
        </Link>

        <button
          type="submit"
          disabled={isPending}
          aria-disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? "正在保存……"
            : "保存项目"}
        </button>
      </div>
    </form>
  );
}