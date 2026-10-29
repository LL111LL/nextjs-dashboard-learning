import type { Metadata } from "next";
import RegisterForm from "./register-form";

export const metadata: Metadata = {
  title: "注册",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-3 rounded-xl bg-blue-600 p-6 text-white">
          <p className="text-sm font-medium">
            Next.js Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            创建账号
          </h1>
        </div>

        <RegisterForm />
      </div>
    </main>
  );
}