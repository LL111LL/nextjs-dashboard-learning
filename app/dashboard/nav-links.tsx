"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { name: "个人资料", href: "/dashboard/profile" },
  { name: "概览", href: "/dashboard" },
  { name: "客户", href: "/dashboard/customers" },
  { name: "发票", href: "/dashboard/invoices" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 flex gap-2 md:flex-col">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={clsx(
            "rounded-md px-3 py-2 hover:bg-blue-500",
            {
              "bg-white font-semibold text-blue-600":
                pathname === link.href,
            },
          )}
        >
          {link.name}
        </Link>
      ))}
    </nav>
  );
}