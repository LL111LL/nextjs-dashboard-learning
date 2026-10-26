import { fetchRevenue } from "../lib/data";

export default async function RevenueChart() {
  const revenue = await fetchRevenue();
  const highestRevenue = Math.max(
    ...revenue.map((item) => item.revenue),
    1,
  );

  return (
    <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">
        月度营收
      </h2>

      <div className="mt-6 overflow-x-auto">
        <div className="flex h-64 min-w-[640px] items-end gap-3">
          {revenue.map((item) => {
            const height = (item.revenue / highestRevenue) * 100;

            return (
              <div
                key={item.month}
                className="flex h-full flex-1 flex-col justify-end"
              >
                <div className="mb-2 text-center text-xs text-zinc-500">
                  ¥{item.revenue}
                </div>

                <div
                  className="rounded-t-md bg-blue-500"
                  style={{ height: `${height}%` }}
                  title={`${item.month}: ¥${item.revenue}`}
                />

                <div className="mt-2 text-center text-xs text-zinc-600">
                  {item.month}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}