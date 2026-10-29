import { Suspense } from "react";
import Search from "./search";
import InvoicesTable from "./table";
import Pagination from "./pagination";
import { fetchInvoicesPages } from "../../lib/data";
import Link from "next/link";
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "发票",
};

type InvoicesPageProps = {
  searchParams: Promise<{
    query?: string;
    page?: string;
  }>;
};

function TableSkeleton() {
  return (
    <div className="mt-6 h-72 animate-pulse rounded-xl bg-zinc-200" />
  );
}
async function PaginationWithData({
  query,
}: {
  query: string;
}) {
  const totalPages = await fetchInvoicesPages(query);

  return <Pagination totalPages={totalPages} />;
}

async function InvoiceResults({
  searchParams,
}: InvoicesPageProps) {
  const params = await searchParams;
  const query = params.query ?? "";

  const requestedPage = Number(params.page);
  const currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  return (
    <>
      <Search />

      <Suspense
        key={`${query}-${currentPage}`}
        fallback={<TableSkeleton />}
      >
        <InvoicesTable
          query={query}
          currentPage={currentPage}
        />
      </Suspense>
      <Suspense
        key={`pagination-${query}`}
        fallback={
          <div className="mt-6 h-10 animate-pulse rounded bg-zinc-200" />
        }
      >
        <PaginationWithData query={query} />
      </Suspense>
    </>
  );
}

export default function InvoicesPage(
  props: InvoicesPageProps,
) {
  return (
    <main className="p-8">
        <div className="flex items-center justify-between gap-4">
    <h1 className="text-3xl font-bold">发票管理</h1>

  <Link
    href="/dashboard/invoices/create"
    className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
  >
    创建发票
  </Link>
  </div>
      <p className="mt-2 text-zinc-600">
        使用客户、邮箱、状态、日期或金额搜索发票。
      </p>

      <div className="mt-6">
        <Suspense fallback={<TableSkeleton />}>
          <InvoiceResults searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}