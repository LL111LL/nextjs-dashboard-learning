"use client";

import { useEffect } from "react";

export default function InvoicesError({
  error,
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("发票页面发生错误：", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="text-5xl" aria-hidden="true">
        ⚠️
      </div>

      <h1 className="mt-4 text-2xl font-bold text-zinc-900">
        发票页面出现问题
      </h1>

      <p className="mt-2 max-w-md text-zinc-600">
        暂时无法完成请求。你可以重试，或者返回发票列表。
      </p>

      {error.digest && (
        <p className="mt-2 text-xs text-zinc-400">
          错误编号：{error.digest}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
        >
          重试
        </button>

        <a
          href="/dashboard/invoices"
          className="rounded-lg border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-50"
        >
          返回发票列表
        </a>
      </div>
    </main>
  );
}