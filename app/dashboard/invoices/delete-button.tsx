"use client";

import { deleteInvoice } from "../../lib/actions";

export default function DeleteInvoiceButton({
  id,
}: {
  id: string;
}) {
  const deleteInvoiceWithId = deleteInvoice.bind(
    null,
    id,
  );

  return (
    <form
      action={deleteInvoiceWithId}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "确定要永久删除这张发票吗？",
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        删除
      </button>
    </form>
  );
}