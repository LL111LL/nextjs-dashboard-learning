import NavLinks from "./nav-links";
import type { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="bg-blue-600 p-6 text-white md:w-64">
        <h2 className="text-xl font-bold">我的控制台</h2>
        <NavLinks />
      </aside>

      <section className="flex-1 bg-zinc-50">{children}</section>
    </div>
  );
}