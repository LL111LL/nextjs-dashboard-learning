import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  fetchCustomers,
  fetchInvoiceById,
} from "../../../../lib/data";
import EditInvoiceForm from "../../edit-form";

type EditInvoicePageProps = {
  params: Promise<{
    id: string;
  }>;
};

function EditFormSkeleton() {
  return (
    <div className="h-80 animate-pulse rounded-xl bg-zinc-200" />
  );
}

async function EditFormWithData({
  params,
}: EditInvoicePageProps) {
  const { id } = await params;

  const [invoice, customers] = await Promise.all([
    fetchInvoiceById(id),
    fetchCustomers(),
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <>
      <nav className="mb-6 text-sm text-zinc-500">
        <Link
          href="/dashboard/invoices"
          className="hover:text-blue-600"
        >
          发票
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900">编辑发票</span>
      </nav>

      <h1 className="mb-6 text-3xl font-bold">
        编辑发票
      </h1>

      <EditInvoiceForm
        invoice={invoice}
        customers={customers}
      />
    </>
  );
}

export default function EditInvoicePage(
  props: EditInvoicePageProps,
) {
  return (
    <main className="p-8">
      <Suspense fallback={<EditFormSkeleton />}>
        <EditFormWithData params={props.params} />
      </Suspense>
    </main>
  );
}