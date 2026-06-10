"use client";

import { friendlyName } from "@/lib/ha";
import { useAccentSky } from "@/lib/useAccent";
import { useDetailStore } from "@/store/detail";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";
import { RadialGauge } from "@/components/ui/RadialGauge";

export function GaugeCard({
  entityId,
  label,
  cfg,
}: {
  entityId: string;
  label?: string | null;
  cfg?: Record<string, any>;
}) {
  const e = useEntityStore((s) => s.entities[entityId]);
  const open = useDetailStore((s) => s.open);
  const sky = useAccentSky();
  if (!e) return null;

  const val = parseFloat(e.state);
  const min = cfg?.min ?? 0;
  const max = cfg?.max ?? 100;
  const unit = cfg?.unit ?? e.attributes?.unit_of_measurement ?? "";

  return (
    <button type="button" onClick={() => open(entityId)} className="w-full">
      <Card className="flex flex-col items-center p-4 transition hover:bg-fg/[0.06]">
        <p className="mb-1 w-full truncate text-sm font-semibold text-fg">
          {label || friendlyName(e)}
        </p>
        {Number.isNaN(val) ? (
          <p className="py-8 text-muted">{e.state}</p>
        ) : (
          <RadialGauge value={val} min={min} max={max} unit={unit} accent={cfg?.color || sky} />
        )}
      </Card>
    </button>
  );
}
