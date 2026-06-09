"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Shield, Wifi, WifiOff } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { Health } from "@/lib/types";
import { useAuth } from "@/lib/useAuth";
import { useEntityStore } from "@/store/entities";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { GlobalSearch } from "./GlobalSearch";

export function Header() {
  const connected = useEntityStore((s) => s.connected);
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["health"],
    queryFn: () => apiGet<Health>("/api/health"),
    refetchInterval: 10000,
  });

  return (
    <header className="mb-6 flex items-center gap-2">
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-2 rounded-2xl border border-line/10 bg-fg/[0.04] px-3 py-2 text-xs backdrop-blur-xl">
        {connected ? (
          <Wifi className="h-4 w-4 text-emerald-400" />
        ) : (
          <WifiOff className="h-4 w-4 text-rose-400" />
        )}
        <span className="font-medium text-fg">{connected ? "Live" : "Offline"}</span>
        {data && <span className="hidden text-muted sm:inline">· {data.entity_count}</span>}
      </div>
      <Link
        href="/admin"
        className="flex items-center gap-2 rounded-2xl border border-line/10 bg-fg/[0.04] px-3 py-2 text-xs text-muted backdrop-blur-xl transition hover:bg-fg/[0.08]"
      >
        <Shield className="h-4 w-4 text-sidra-sky" />
        <span className="hidden font-medium text-fg sm:inline">
          {user ? user.username : "Admin"}
        </span>
      </Link>
      <ThemeToggle />
    </header>
  );
}
