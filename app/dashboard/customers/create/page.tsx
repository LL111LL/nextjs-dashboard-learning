import type { Metadata } from "next";

import CreateCustomerForm from "./create-customer-form";

export const metadata: Metadata = {
  title: "新增客户",
};

export default function CreateCustomerPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">
        新增客户
      </h1>

      <p className="mt-2 text-zinc-600">
        创建的客户只属于当前登录账号。
      </p>

      <CreateCustomerForm />
    </main>
  );
}