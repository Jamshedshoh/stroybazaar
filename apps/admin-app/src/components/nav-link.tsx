"use client";

import { cx } from "@stroybazaar/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, exact, children }: { href: string; exact?: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap",
        active ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100",
      )}
    >
      {children}
    </Link>
  );
}
