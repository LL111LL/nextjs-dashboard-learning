import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "客户",
};

export default function CustomersPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">客户管理</h1>
      <p className="mt-4 text-zinc-600">这里将显示客户列表。</p>
    </main>
  );
}