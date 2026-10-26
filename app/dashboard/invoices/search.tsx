"use client";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export default function Search() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);

    params.set("page", "1");

    if (term.trim()) {
      params.set("query", term.trim());
    } else {
      params.delete("query");
    }

    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <label className="block">
      <span className="sr-only">搜索发票</span>
      <input
        type="search"
        placeholder="搜索客户、邮箱或状态……"
        defaultValue={searchParams.get("query") ?? ""}
        onChange={(event) => {
          handleSearch(event.target.value);
        }}
        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}