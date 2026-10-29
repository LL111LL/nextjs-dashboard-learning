import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";

import { fetchCustomerSummaries } from "../../lib/data";

export const metadata: Metadata = {
  title: "客户",
};

function formatCurrency(amountInCents: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
  }).format(amountInCents / 100);
}

async function CustomersTable() {
  const customers = await fetchCustomerSummaries();

  if (customers.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">
        暂无客户。
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full text-left">
        <thead className="bg-zinc-50 text-sm text-zinc-600">
          <tr>
            <th className="px-4 py-3 font-medium">
              客户
            </th>
            <th className="px-4 py-3 font-medium">
              发票数量
            </th>
            <th className="px-4 py-3 font-medium">
              已收款
            </th>
            <th className="px-4 py-3 font-medium">
              待收款
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-zinc-100">
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Image
                    src={customer.imageUrl}
                    width={40}
                    height={40}
                    alt={`${customer.name}的头像`}
                    className="h-10 w-10 rounded-full bg-zinc-100 p-1"
                  />

                  <div>
                    <p className="font-medium text-zinc-900">
                      {customer.name}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {customer.email}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3 text-zinc-700">
                {customer.invoiceCount}
              </td>

              <td className="px-4 py-3 font-medium text-green-700">
                {formatCurrency(customer.totalPaid)}
              </td>

              <td className="px-4 py-3 font-medium text-yellow-700">
                {formatCurrency(
                  customer.totalPending,
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomersTableSkeleton() {
  return (
    <div className="mt-6 h-64 animate-pulse rounded-xl bg-zinc-200" />
  );
}

export default function CustomersPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">
        客户管理
      </h1>

      <p className="mt-2 text-zinc-600">
        查看当前账号与每位客户之间的发票汇总。
      </p>

      <Suspense fallback={<CustomersTableSkeleton />}>
        <CustomersTable />
      </Suspense>
    </main>
  );
}