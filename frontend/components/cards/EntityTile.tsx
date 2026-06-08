"use client";

import { domainOf } from "@/lib/ha";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";
import { DeviceTile } from "./DeviceTile";
import { StatTile } from "./StatTile";

const TOGGLEABLE = ["light", "switch", "fan", "input_boolean"];

export function EntityTile({
  entityId,
  label,
}: {
  entityId: string;
  label?: string | null;
}) {
  // Per-entity subscription: only this tile re-renders when its entity changes.
  const entity = useEntityStore((s) => s.entities[entityId]);

  if (!entity) {
    return (
      <Card className="flex flex-col justify-between gap-2 p-4 opacity-50">
        <p className="truncate text-sm font-medium text-white">
          {label || entityId}
        </p>
        <p className="text-xs text-slate-500">Unavailable</p>
      </Card>
    );
  }

  if (TOGGLEABLE.includes(domainOf(entityId))) {
    return <DeviceTile entity={entity} label={label} />;
  }
  return <StatTile entity={entity} label={label} />;
}
