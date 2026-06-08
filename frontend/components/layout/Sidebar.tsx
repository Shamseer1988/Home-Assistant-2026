"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-20 shrink-0 flex-col items-center gap-2 border-r border-line/5 py-6 md:flex">
      <Link
        href="/"
        className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sidra-blue to-sidra-sky text-lg font-bold text-fg shadow-glow"
      >
        S
      </Link>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
              active
                ? "bg-fg/10 text-sidra-sky"
                : "text-muted hover:bg-fg/5 hover:text-fg"
            )}
          >
            <Icon className="h-5 w-5" />
          </Link>
        );
      })}
    </aside>
  );
}
