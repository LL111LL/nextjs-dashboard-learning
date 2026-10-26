import Link from "next/link";
import { Suspense } from "react";
import { fetchCustomers } from "../../../lib/data";
import CreateInvoiceForm from "../create-form";

function FormSkeleton() {
  return (
    <div className="h-80 animate-pulse rounded-xl bg-zinc-200" />
  );
}

async function FormWithCustomers() {
  const customers = await fetchCustomers();

  return <CreateInvoiceForm customers={customers} />;
}

export default function CreateInvoicePage() {
  return (
    <main className="p-8">
      <nav className="mb-6 text-sm text-zinc-500">
        <Link
          href="/dashboard/invoices"
          className="hover:text-blue-600"
        >
          发票
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900">创建发票</span>
      </nav>

      <h1 className="mb-6 text-3xl font-bold">
        创建发票
      </h1>

      <Suspense fallback={<FormSkeleton />}>
        <FormWithCustomers />
      </Suspense>
    </main>
  );
}