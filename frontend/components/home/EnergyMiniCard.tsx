"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Zap } from "lucide-react";
import { fetchHistory } from "@/lib/api";
import { firstByDeviceClass, selectByDeviceClass } from "@/lib/selectors";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";
import { Sparkline } from "@/components/ui/Sparkline";

export function EnergyMiniCard() {
  const entities = useEntityStore((s) => s.entities);
  const power = firstByDeviceClass(entities, "power");
  const energyToday = selectByDeviceClass(entities, "energy").slice(0, 3);
  const { data } = useQuery({
    queryKey: ["history", power?.entity_id, "12"],
    queryFn: () => fetchHistory(power!.entity_id, 12),
    enabled: !!power,
  });

  if (!power && energyToday.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-sidra-sky" />
          <h3 className="font-semibold text-fg">Energy</h3>
        </div>
        <Link href="/energy" className="flex items-center gap-1 text-xs text-sidra-sky hover:underline">
          More <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {power && (
        <p className="text-3xl font-bold text-fg">
          {Math.round(parseFloat(power.state)) || 0}
          <span className="ml-1 text-base text-muted">
            {power.attributes?.unit_of_measurement || "W"}
          </span>
        </p>
      )}
      {data && data.points.length > 1 && (
        <div className="mt-2">
          <Sparkline points={data.points} accent="#59a0ff" />
        </div>
      )}

      {energyToday.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line/10 pt-3">
          {energyToday.map((e) => (
            <div key={e.entity_id} className="text-center">
              <p className="truncate text-sm font-semibold text-fg">
                {(parseFloat(e.state) || 0).toFixed(1)}
              </p>
              <p className="truncate text-[10px] text-muted">
                {(e.attributes?.friendly_name || "").split(" ").slice(-2).join(" ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
