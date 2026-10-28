import Link from "next/link";

export default function InvoiceNotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="text-5xl" aria-hidden="true">
        🔍
      </div>

      <h1 className="mt-4 text-2xl font-bold text-zinc-900">
        404：找不到发票
      </h1>

      <p className="mt-2 max-w-md text-zinc-600">
        这张发票可能不存在、已经被删除，或者链接中的 ID
        不正确。
      </p>

      <Link
        href="/dashboard/invoices"
        className="mt-6 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
      >
        返回发票列表
      </Link>
    </main>
  );
}