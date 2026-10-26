"use client";

import Link from "next/link";
import {
  usePathname,
  useSearchParams,
} from "next/navigation";

export default function Pagination({
  totalPages,
}: {
  totalPages: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedPage = Number(searchParams.get("page"));
  const currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  function createPageUrl(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());

    return `${pathname}?${params.toString()}`;
  }

  const previousPage = currentPage - 1;
  const nextPage = currentPage + 1;

  return (
    <nav
      aria-label="发票分页"
      className="mt-6 flex items-center justify-center gap-2"
    >
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(previousPage)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 hover:bg-zinc-50"
        >
          上一页
        </Link>
      ) : (
        <span className="cursor-not-allowed rounded-md border border-zinc-200 px-3 py-2 text-zinc-400">
          上一页
        </span>
      )}

      {Array.from(
        { length: totalPages },
        (_, index) => index + 1,
      ).map((page) => (
        <Link
          key={page}
          href={createPageUrl(page)}
          aria-current={
            page === currentPage ? "page" : undefined
          }
          className={
            page === currentPage
              ? "rounded-md bg-blue-600 px-3 py-2 text-white"
              : "rounded-md border border-zinc-300 bg-white px-3 py-2 hover:bg-zinc-50"
          }
        >
          {page}
        </Link>
      ))}

      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(nextPage)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 hover:bg-zinc-50"
        >
          下一页
        </Link>
      ) : (
        <span className="cursor-not-allowed rounded-md border border-zinc-200 px-3 py-2 text-zinc-400">
          下一页
        </span>
      )}
    </nav>
  );
}