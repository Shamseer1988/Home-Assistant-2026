"use client";

import { cardSpan } from "@/lib/cardTypes";
import { isOn } from "@/lib/ha";
import { roomIcon } from "@/lib/roomIcon";
import type { DashSection } from "@/lib/types";
import { useEntityStore } from "@/store/entities";
import { DashCard } from "./DashCard";

export function RoomSection({ section }: { section: DashSection }) {
  const Icon = roomIcon(section.name);

  // Selector returns a number, so this header only re-renders when the count
  // actually changes — the tiles update themselves independently.
  const onCount = useEntityStore((s) =>
    section.items.reduce((n, it) => {
      const e = it.entity_id ? s.entities[it.entity_id] : undefined;
      return n + (e && isOn(e) ? 1 : 0);
    }, 0)
  );

  if (section.items.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-fg/5">
          <Icon className="h-4 w-4 text-sidra-sky" />
        </span>
        <h2 className="text-lg font-semibold text-fg">{section.name}</h2>
        <span className="text-xs text-muted">
          {onCount > 0 && `${onCount} on · `}
          {section.items.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {section.items.map((it) => (
          <div key={it.id} className={cardSpan(it.type)}>
            <DashCard item={it} />
          </div>
        ))}
      </div>
    </section>
  );
}
