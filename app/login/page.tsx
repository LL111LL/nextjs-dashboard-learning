import { Suspense } from "react";
import LoginForm from "./login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "登录",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-3 rounded-xl bg-blue-600 p-6 text-white">
          <p className="text-sm font-medium">Next.js Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold">
            登录
          </h1>
        </div>

        <Suspense fallback={<p>正在加载登录表单……</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}