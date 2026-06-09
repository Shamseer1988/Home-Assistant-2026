"use client";

import { selectClimate } from "@/lib/selectors";
import { useDetailStore } from "@/store/detail";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";
import { RadialGauge } from "@/components/ui/RadialGauge";

export function ClimateDialCard() {
  const entities = useEntityStore((s) => s.entities);
  const climate = selectClimate(entities);
  const open = useDetailStore((s) => s.open);
  if (!climate) return null;

  const a = climate.attributes || {};
  const target = a.temperature ?? a.current_temperature ?? 22;
  const min = a.min_temp ?? 16;
  const max = a.max_temp ?? 30;

  return (
    <button type="button" onClick={() => open(climate.entity_id)} className="w-full text-left">
      <Card className="flex flex-col items-center p-5 transition hover:bg-fg/[0.06]">
        <p className="mb-1 self-start text-sm font-semibold text-fg">Climate</p>
        <RadialGauge
          value={target}
          min={min}
          max={max}
          unit="°"
          sub={a.current_temperature != null ? `Now ${a.current_temperature}°` : climate.state}
          accent="#fb923c"
        />
      </Card>
    </button>
  );
}
