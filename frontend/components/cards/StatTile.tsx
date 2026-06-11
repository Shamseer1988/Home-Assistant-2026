"use client";

import { Card } from "@/components/ui/Card";
import { friendlyName } from "@/lib/ha";
import { iconFor } from "@/lib/icons";
import { useCardGestures, type CardActions } from "@/lib/tapAction";
import type { HAEntity } from "@/lib/types";
import { useDetailStore } from "@/store/detail";

export function StatTile({
  entity,
  label,
  color,
  actions,
}: {
  entity: HAEntity;
  label?: string | null;
  color?: string | null;
  actions?: CardActions;
}) {
  const Icon = iconFor(entity);
  const unit = entity.attributes?.unit_of_measurement as string | undefined;
  const openDetail = useDetailStore((s) => s.open);
  const { handlers } = useCardGestures(entity.entity_id, actions || {}, () =>
    openDetail(entity.entity_id)
  );

  return (
    <button type="button" {...handlers} className="w-full text-left">
      <Card className="flex items-center gap-3 p-4 transition hover:bg-fg/[0.07]">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fg/5"
          style={color ? { backgroundColor: `${color}26` } : undefined}
        >
          <Icon className={color ? "h-5 w-5" : "h-5 w-5 text-sky-300"} style={color ? { color } : undefined} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted">
            {label || friendlyName(entity)}
          </p>
          <p className="truncate text-base font-semibold text-fg">
            {entity.state}
            {unit && <span className="ml-1 text-xs text-muted">{unit}</span>}
          </p>
        </div>
      </Card>
    </button>
  );
}
