"use client";

import { friendlyName, stateLabel } from "@/lib/ha";
import { iconFor } from "@/lib/icons";
import { useDetailStore } from "@/store/detail";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";

export function EntitiesCard({ ids, title }: { ids: string[]; title?: string }) {
  const entities = useEntityStore((s) => s.entities);
  const open = useDetailStore((s) => s.open);
  const items = ids.map((id) => entities[id]).filter(Boolean);
  if (items.length === 0) return null;

  return (
    <Card className="p-4">
      {title && <p className="mb-1 text-sm font-semibold text-fg">{title}</p>}
      <div className="divide-y divide-line/10">
        {items.map((e) => {
          const Icon = iconFor(e);
          const unit = e.attributes?.unit_of_measurement as string | undefined;
          return (
            <button
              key={e.entity_id}
              type="button"
              onClick={() => open(e.entity_id)}
              className="flex w-full items-center gap-3 py-2 text-left"
            >
              <Icon className="h-4 w-4 shrink-0 text-sidra-sky" />
              <span className="flex-1 truncate text-sm text-fg">{friendlyName(e)}</span>
              <span className="shrink-0 text-sm text-muted">
                {stateLabel(e)}
                {unit ? ` ${unit}` : ""}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
