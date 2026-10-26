import { Suspense } from "react";
import Search from "./search";
import InvoicesTable from "./table";

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
    </>
  );
}

export default function InvoicesPage(
  props: InvoicesPageProps,
) {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">发票管理</h1>
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