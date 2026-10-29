"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard 页面错误：", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="w-full max-w-lg rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">
          页面加载失败
        </h1>

        <p className="mt-3 text-zinc-600">
          无法加载控制台数据，请稍后重试。
        </p>

        {error.digest && (
          <p className="mt-3 font-mono text-xs text-zinc-400">
            错误编号：{error.digest}
          </p>
        )}

        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
        >
          重新加载
        </button>
      </div>
    </main>
  );
}