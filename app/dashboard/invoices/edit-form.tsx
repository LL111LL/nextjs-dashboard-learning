import Link from "next/link";
import { updateInvoice } from "../../lib/actions";
import type {
  CustomerOption,
  InvoiceFormData,
} from "../../lib/data";

export default function EditInvoiceForm({
  invoice,
  customers,
}: {
  invoice: InvoiceFormData;
  customers: CustomerOption[];
}) {
  const updateInvoiceWithId = updateInvoice.bind(
    null,
    invoice.id,
  );

  return (
    <form action={updateInvoiceWithId}>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div>
          <label
            htmlFor="customer"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            客户
          </label>

          <select
            id="customer"
            name="customerId"
            defaultValue={invoice.customerId}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          >
            {customers.map((customer) => (
              <option
                key={customer.id}
                value={customer.id}
              >
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5">
          <label
            htmlFor="amount"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            金额（元）
          </label>

          <input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            defaultValue={invoice.amount / 100}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium text-zinc-700">
            状态
          </legend>

          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="status"
                value="pending"
                defaultChecked={
                  invoice.status === "pending"
                }
              />
              待处理
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="status"
                value="paid"
                defaultChecked={
                  invoice.status === "paid"
                }
              />
              已支付
            </label>
          </div>
        </fieldset>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Link
          href="/dashboard/invoices"
          className="rounded-lg border border-zinc-300 px-4 py-2 hover:bg-zinc-50"
        >
          取消
        </Link>

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
        >
          保存修改
        </button>
      </div>
    </form>
  );
}