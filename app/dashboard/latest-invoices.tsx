import Image from "next/image";
import clsx from "clsx";
import { fetchLatestInvoices } from "../lib/data";

function formatCurrency(amountInCents: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
  }).format(amountInCents / 100);
}

export default async function LatestInvoices() {
  const invoices = await fetchLatestInvoices();

  return (
    <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">
        最新发票
      </h2>

      <div className="mt-4 divide-y divide-zinc-100">
        {invoices.map((invoice) => (
          <article
            key={`${invoice.email}-${invoice.date}`}
            className="flex items-center gap-3 py-4"
          >
            <Image
              src={invoice.imageUrl}
              width={40}
              height={40}
              alt={`${invoice.name}的头像`}
              className="h-10 w-10 rounded-full bg-zinc-100 p-1"
            />

            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-900">
                {invoice.name}
              </p>
              <p className="truncate text-sm text-zinc-500">
                {invoice.email}
              </p>
            </div>

            <div className="text-right">
              <p className="font-semibold text-zinc-900">
                {formatCurrency(invoice.amount)}
              </p>

              <span
                className={clsx(
                  "inline-flex rounded-full px-2 py-0.5 text-xs",
                  {
                    "bg-green-100 text-green-700":
                      invoice.status === "paid",
                    "bg-yellow-100 text-yellow-700":
                      invoice.status === "pending",
                  },
                )}
              >
                {invoice.status === "paid" ? "已支付" : "待处理"}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}