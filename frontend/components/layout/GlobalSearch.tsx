"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { friendlyName } from "@/lib/ha";
import { iconFor } from "@/lib/icons";
import { useDetailStore } from "@/store/detail";
import { useEntityStore } from "@/store/entities";

export function GlobalSearch() {
  const entities = useEntityStore((s) => s.entities);
  const open = useDetailStore((s) => s.open);
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);

  const term = q.toLowerCase().trim();
  const results = term
    ? Object.values(entities)
        .filter(
          (e) =>
            e.entity_id.toLowerCase().includes(term) ||
            friendlyName(e).toLowerCase().includes(term)
        )
        .slice(0, 8)
    : [];

  return (
    <div className="relative hidden max-w-md flex-1 sm:block">
      <div className="flex items-center gap-2 rounded-2xl border border-line/10 bg-fg/[0.04] px-3 backdrop-blur-xl">
        <Search className="h-4 w-4 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 150)}
          placeholder="Search entities…"
          className="w-full bg-transparent py-2 text-sm text-fg outline-none"
        />
      </div>
      {focus && results.length > 0 && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-line/10 bg-panel p-1.5 shadow-glass">
          {results.map((e) => {
            const Icon = iconFor(e);
            return (
              <button
                key={e.entity_id}
                type="button"
                onMouseDown={() => {
                  open(e.entity_id);
                  setQ("");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-fg/5"
              >
                <Icon className="h-4 w-4 shrink-0 text-sidra-sky" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-fg">{friendlyName(e)}</span>
                  <span className="block truncate text-[11px] text-muted">{e.entity_id}</span>
                </span>
                <span className="shrink-0 text-xs capitalize text-muted">{e.state}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
