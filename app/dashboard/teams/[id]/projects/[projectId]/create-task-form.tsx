"use client";

import { useActionState } from "react";

import {
  createTask,
  type TaskActionState,
} from "@/app/lib/task-actions";

type TeamMemberOption = {
  id: string;
  name: string;
  email: string;
};

type CreateTaskFormProps = {
  teamId: string;
  projectId: string;
  members: TeamMemberOption[];
};

const initialState: TaskActionState = {
  success: false,
  errors: {},
  message: null,
};

export default function CreateTaskForm({
  teamId,
  projectId,
  members,
}: CreateTaskFormProps) {
  const createTaskForProject =
    createTask.bind(
      null,
      teamId,
      projectId,
    );

  const [state, formAction, isPending] =
    useActionState(
      createTaskForProject,
      initialState,
    );

  return (
    <form
      action={formAction}
      className="mt-6 space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label
          htmlFor="task-title"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          任务标题
        </label>

        <input
          id="task-title"
          name="title"
          type="text"
          required
          minLength={2}
          maxLength={200}
          aria-describedby="task-title-error"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
        />

        <FieldErrors
          id="task-title-error"
          errors={state.errors?.title}
        />
      </div>

      <div>
        <label
          htmlFor="task-description"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          任务说明
        </label>

        <textarea
          id="task-description"
          name="description"
          rows={4}
          maxLength={2000}
          aria-describedby="task-description-error"
          placeholder="可选，填写任务要求。"
          className="w-full resize-y rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
        />

        <FieldErrors
          id="task-description-error"
          errors={state.errors?.description}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="task-assignee"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            负责人
          </label>

          <select
            id="task-assignee"
            name="assigneeId"
            aria-describedby="task-assignee-error"
            defaultValue=""
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
          >
            <option value="">
              暂不分配
            </option>

            {members.map((member) => (
              <option
                key={member.id}
                value={member.id}
              >
                {member.name}（{member.email}）
              </option>
            ))}
          </select>

          <FieldErrors
            id="task-assignee-error"
            errors={state.errors?.assigneeId}
          />
        </div>

        <div>
          <label
            htmlFor="task-due-date"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            截止日期
          </label>

          <input
            id="task-due-date"
            name="dueDate"
            type="date"
            aria-describedby="task-due-date-error"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
          />

          <FieldErrors
            id="task-due-date-error"
            errors={state.errors?.dueDate}
          />
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
          ? "正在创建……"
          : "创建任务"}
      </button>
    </form>
  );
}

function FieldErrors({
  id,
  errors,
}: {
  id: string;
  errors?: string[];
}) {
  return (
    <div
      id={id}
      aria-live="polite"
      aria-atomic="true"
    >
      {errors?.map((error) => (
        <p
          key={error}
          className="mt-2 text-sm text-red-500"
        >
          {error}
        </p>
      ))}
    </div>
  );
}