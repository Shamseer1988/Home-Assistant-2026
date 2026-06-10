"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchHistory } from "@/lib/api";
import { friendlyName } from "@/lib/ha";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";
import { Sparkline } from "@/components/ui/Sparkline";

export function GraphCard({
  entityId,
  label,
  cfg,
}: {
  entityId: string;
  label?: string | null;
  cfg?: Record<string, any>;
}) {
  const e = useEntityStore((s) => s.entities[entityId]);
  const hours = cfg?.hours || 24;
  const { data } = useQuery({
    queryKey: ["history", entityId, hours],
    queryFn: () => fetchHistory(entityId, hours),
    enabled: !!e,
  });
  if (!e) return null;
  const unit = e.attributes?.unit_of_measurement as string | undefined;

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="truncate text-sm font-semibold text-fg">{label || friendlyName(e)}</p>
        <p className="shrink-0 text-lg font-bold text-fg">
          {e.state}
          {unit && <span className="ml-0.5 text-xs text-muted">{unit}</span>}
        </p>
      </div>
      {data && data.points.length > 1 ? (
        <Sparkline points={data.points} height={56} accent={cfg?.color} />
      ) : (
        <p className="py-4 text-xs text-muted">Collecting history…</p>
      )}
    </Card>
  );
}
