"use client";

import { weatherIcon } from "@/lib/weatherIcon";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";

export function WeatherMiniCard({ entityId }: { entityId: string }) {
  const e = useEntityStore((s) => s.entities[entityId]);
  if (!e) return null;
  const a = e.attributes || {};
  const Icon = weatherIcon(e.state);
  return (
    <Card className="flex items-center gap-4 p-4">
      <Icon className="h-12 w-12 text-sidra-sky" />
      <div>
        <p className="text-3xl font-bold text-fg">
          {a.temperature != null ? Math.round(a.temperature) : "--"}°
        </p>
        <p className="text-sm capitalize text-muted">{(e.state || "").replace(/_/g, " ")}</p>
      </div>
      {a.humidity != null && (
        <p className="ml-auto text-sm text-muted">💧 {a.humidity}%</p>
      )}
    </Card>
  );
}
