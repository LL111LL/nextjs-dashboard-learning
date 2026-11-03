"use client";

import { useActionState } from "react";

import {
  deleteCustomer,
  type DeleteCustomerState,
} from "../../lib/customer-actions";

const initialState: DeleteCustomerState = {
  success: false,
  message: null,
};

export default function DeleteCustomerButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const deleteCustomerWithId =
    deleteCustomer.bind(null, id);

  const [state, formAction, isPending] =
    useActionState(
      deleteCustomerWithId,
      initialState,
    );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `确定要永久删除客户“${name}”吗？`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
      className="inline-flex flex-col items-end"
    >
      <button
        type="submit"
        disabled={isPending}
        aria-disabled={isPending}
        className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "删除中……" : "删除"}
      </button>

      {!state.success && state.message && (
        <p
          className="mt-2 max-w-64 text-right text-xs text-red-500"
          aria-live="polite"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}