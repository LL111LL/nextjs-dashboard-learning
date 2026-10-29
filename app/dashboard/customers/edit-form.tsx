"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  updateCustomer,
  type CustomerActionState,
} from "../../lib/customer-actions";
import type { CustomerFormData } from "../../lib/data";

export default function EditCustomerForm({
  customer,
}: {
  customer: CustomerFormData;
}) {
  const updateCustomerWithId =
    updateCustomer.bind(null, customer.id);

  const initialState: CustomerActionState = {
    message: null,
    errors: {},
  };

  const [state, formAction, isPending] =
    useActionState(
      updateCustomerWithId,
      initialState,
    );

  return (
    <form
      action={formAction}
      noValidate
      className="max-w-2xl space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          客户姓名
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={customer.name}
          aria-describedby="name-error"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
        />

        <FieldErrors
          id="name-error"
          errors={state.errors?.name}
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          电子邮箱
        </label>

        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={customer.email}
          aria-describedby="email-error"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
        />

        <FieldErrors
          id="email-error"
          errors={state.errors?.email}
        />
      </div>

      <div
        aria-live="polite"
        aria-atomic="true"
        className="min-h-6"
      >
        {state.message && (
          <p className="text-sm text-red-500">
            {state.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Link
          href="/dashboard/customers"
          className="rounded-lg border border-zinc-300 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50"
        >
          取消
        </Link>

        <button
          type="submit"
          disabled={isPending}
          aria-disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "正在保存……" : "保存修改"}
        </button>
      </div>
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