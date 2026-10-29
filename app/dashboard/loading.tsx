export default function DashboardLoading() {
  return (
    <main
      className="p-8"
      aria-busy="true"
      aria-label="正在加载控制台"
    >
      <div className="h-9 w-40 animate-pulse rounded bg-zinc-200" />
      <div className="mt-3 h-5 w-72 animate-pulse rounded bg-zinc-200" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl bg-zinc-200"
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-xl bg-zinc-200" />
        <div className="h-80 animate-pulse rounded-xl bg-zinc-200" />
      </div>

      <p className="sr-only">
        正在加载，请稍候。
      </p>
    </main>
  );
}