import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { fetchCustomerById } from "../../../../lib/data";
import EditCustomerForm from "../../edit-form";

export const metadata: Metadata = {
  title: "编辑客户",
};

type EditCustomerPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function EditCustomerWithData({
  params,
}: EditCustomerPageProps) {
  const { id } = await params;
  const customer = await fetchCustomerById(id);

  if (!customer) {
    notFound();
  }

  return (
    <>
      <nav className="mb-6 text-sm text-zinc-500">
        <Link
          href="/dashboard/customers"
          className="hover:text-blue-600"
        >
          客户
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900">
          编辑客户
        </span>
      </nav>

      <h1 className="mb-6 text-3xl font-bold">
        编辑客户
      </h1>

      <EditCustomerForm customer={customer} />
    </>
  );
}

function EditCustomerSkeleton() {
  return (
    <div className="h-72 animate-pulse rounded-xl bg-zinc-200" />
  );
}

export default function EditCustomerPage(
  props: EditCustomerPageProps,
) {
  return (
    <main className="p-8">
      <Suspense fallback={<EditCustomerSkeleton />}>
        <EditCustomerWithData
          params={props.params}
        />
      </Suspense>
    </main>
  );
}