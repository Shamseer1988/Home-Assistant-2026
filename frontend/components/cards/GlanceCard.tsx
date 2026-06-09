"use client";

import { friendlyName, isOn } from "@/lib/ha";
import { iconFor } from "@/lib/icons";
import { useDetailStore } from "@/store/detail";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";

export function GlanceCard({ ids, title }: { ids: string[]; title?: string }) {
  const entities = useEntityStore((s) => s.entities);
  const open = useDetailStore((s) => s.open);
  const items = ids.map((id) => entities[id]).filter(Boolean);
  if (items.length === 0) return null;

  return (
    <Card className="p-4">
      {title && <p className="mb-3 text-sm font-semibold text-fg">{title}</p>}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {items.map((e) => {
          const Icon = iconFor(e);
          const on = isOn(e);
          return (
            <button
              key={e.entity_id}
              type="button"
              onClick={() => open(e.entity_id)}
              className="flex flex-col items-center gap-1"
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  on ? "bg-sidra-sky/20 text-sidra-sky" : "bg-fg/5 text-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="w-full truncate text-center text-[11px] text-muted">
                {friendlyName(e)}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
