import NavLinks from "./nav-links";
import { Suspense, type ReactNode } from "react";
import { signOut } from "@/auth";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="bg-blue-600 p-6 text-white md:w-64">
        <h2 className="text-xl font-bold">我的控制台</h2>
        <Suspense
          fallback={
            <nav className="mt-6">
              <div className="h-28 animate-pulse rounded-md bg-blue-500" />
            </nav>
          }
        >
          <NavLinks />
        </Suspense>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="mt-6"
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-500 px-4 py-2 text-left font-medium text-white hover:bg-blue-400"
          >
            退出登录
          </button>
        </form>       
      </aside>

      <section className="flex-1 bg-zinc-50">
        <Suspense fallback={<div className="flex items-center justify-center p-8">加载中...</div>}>
          {children}
        </Suspense>
      </section>
    </div>
  );
}