import Image from "next/image";
import clsx from "clsx";
import { fetchFilteredInvoices } from "../../lib/data";
import Link from "next/link";
import DeleteInvoiceButton from "./delete-button";

function formatCurrency(amountInCents: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
  }).format(amountInCents / 100);
}

export default async function InvoicesTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const invoices = await fetchFilteredInvoices(
    query,
    currentPage,
  );

  if (invoices.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">
        没有找到符合条件的发票。
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full text-left">
        <thead className="bg-zinc-50 text-sm text-zinc-600">
          <tr>
            <th className="px-4 py-3 font-medium">客户</th>
            <th className="px-4 py-3 font-medium">金额</th>
            <th className="px-4 py-3 font-medium">日期</th>
            <th className="px-4 py-3 font-medium">状态</th>
            <th className="px-4 py-3 text-right font-medium">操作</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-zinc-100">
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Image
                    src={invoice.imageUrl}
                    width={36}
                    height={36}
                    alt={`${invoice.name}的头像`}
                    className="h-9 w-9 rounded-full bg-zinc-100 p-1"
                  />

                  <div>
                    <p className="font-medium text-zinc-900">
                      {invoice.name}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {invoice.email}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3 font-medium text-zinc-900">
                {formatCurrency(invoice.amount)}
              </td>

              <td className="px-4 py-3 text-zinc-600">
                {new Date(invoice.date).toLocaleDateString(
                  "zh-CN",
                )}
              </td>

              <td className="px-4 py-3">
                <span
                  className={clsx(
                    "inline-flex rounded-full px-2 py-1 text-xs font-medium",
                    {
                      "bg-green-100 text-green-700":
                        invoice.status === "paid",
                      "bg-yellow-100 text-yellow-700":
                        invoice.status === "pending",
                    },
                  )}
                >
                  {invoice.status === "paid"
                    ? "已支付"
                    : "待处理"}
                </span>
              </td>
              <td className="px-4 py-3">
              <div className="flex justify-end gap-2">
                <Link
                  href={`/dashboard/invoices/${invoice.id}/edit`}
                  className="inline-flex rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  编辑
                </Link>

                <DeleteInvoiceButton id={invoice.id} />
              </div>
            </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}