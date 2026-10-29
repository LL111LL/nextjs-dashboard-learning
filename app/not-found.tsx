import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-blue-600">
          404
        </p>

        <h1 className="mt-2 text-3xl font-bold text-zinc-900">
          页面不存在
        </h1>

        <p className="mt-3 text-zinc-600">
          你访问的页面可能已被删除，或者地址输入有误。
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-lg border border-zinc-300 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50"
          >
            返回首页
          </Link>

          <Link
            href="/dashboard"
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
          >
            进入控制台
          </Link>
        </div>
      </div>
    </main>
  );
}