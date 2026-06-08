"use client";

import { useQuery } from "@tanstack/react-query";
import { Wifi, WifiOff } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { Health } from "@/lib/types";
import { useEntityStore } from "@/store/entities";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function Header() {
  const connected = useEntityStore((s) => s.connected);
  const { data } = useQuery({
    queryKey: ["health"],
    queryFn: () => apiGet<Health>("/api/health"),
    refetchInterval: 10000,
  });

  return (
    <header className="mb-8 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-slate-400">{greeting()}</p>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          SIDRA <span className="text-base font-medium text-slate-500">Home</span>
        </h1>
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs backdrop-blur-xl">
        {connected ? (
          <Wifi className="h-4 w-4 text-emerald-400" />
        ) : (
          <WifiOff className="h-4 w-4 text-rose-400" />
        )}
        <span className="font-medium text-white">
          {connected ? "Live" : "Offline"}
        </span>
        {data && (
          <span className="text-slate-400">· {data.entity_count} entities</span>
        )}
      </div>
    </header>
  );
}
