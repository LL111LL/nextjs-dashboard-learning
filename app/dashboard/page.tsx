import { Suspense } from "react";
import { fetchCardData } from "../lib/data";

function formatCurrency(amountInCents: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
  }).format(amountInCents / 100);
}

function CardsSkeleton() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-28 animate-pulse rounded-xl bg-zinc-200"
        />
      ))}
    </div>
  );
}

async function DashboardCards() {
  const {
    numberOfInvoices,
    numberOfCustomers,
    totalPaidInvoices,
    totalPendingInvoices,
  } = await fetchCardData();

  const cards = [
    {
      title: "已收款",
      value: formatCurrency(totalPaidInvoices),
    },
    {
      title: "待收款",
      value: formatCurrency(totalPendingInvoices),
    },
    {
      title: "发票数量",
      value: numberOfInvoices.toString(),
    },
    {
      title: "客户数量",
      value: numberOfCustomers.toString(),
    },
  ];

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <section
          key={card.title}
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-sm font-medium text-zinc-500">
            {card.title}
          </h2>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {card.value}
          </p>
        </section>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">控制台</h1>
      <p className="mt-2 text-zinc-600">
        以下数据直接读取自 Neon PostgreSQL。
      </p>

      <Suspense fallback={<CardsSkeleton />}>
        <DashboardCards />
      </Suspense>
    </main>
  );
}