import NavLinks from "./nav-links";
import { Suspense, type ReactNode } from "react";
import { auth, signOut } from "@/auth";

async function UserInfo() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg bg-blue-500 p-3 text-sm">
      <p className="font-medium">
        {session.user.name || "已登录用户"}
      </p>

      {session.user.email && (
        <p className="mt-1 truncate text-blue-100">
          {session.user.email}
        </p>
      )}
    </div>
  );
}

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
            <div className="mt-4 h-16 animate-pulse rounded-lg bg-blue-500" />
          }
        >
          <UserInfo />
        </Suspense>
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