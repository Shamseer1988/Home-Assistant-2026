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
  color,
  actions,
}: {
  entityId: string;
  label?: string | null;
  color?: string | null;
  actions?: import("@/lib/tapAction").CardActions;
}) {
  // Per-entity subscription: only this tile re-renders when its entity changes.
  const entity = useEntityStore((s) => s.entities[entityId]);

  if (!entity) {
    return (
      <Card className="flex flex-col justify-between gap-2 p-4 opacity-50">
        <p className="truncate text-sm font-medium text-fg">
          {label || entityId}
        </p>
        <p className="text-xs text-muted">Unavailable</p>
      </Card>
    );
  }

  if (TOGGLEABLE.includes(domainOf(entityId))) {
    return <DeviceTile entity={entity} label={label} color={color} actions={actions} />;
  }
  return <StatTile entity={entity} label={label} color={color} actions={actions} />;
}
