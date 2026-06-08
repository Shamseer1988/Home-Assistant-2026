"use client";

import { useQuery } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { fetchHistory } from "@/lib/api";
import { selectByDeviceClass } from "@/lib/selectors";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";
import { BarChart } from "@/components/ui/BarChart";
import { Sparkline } from "@/components/ui/Sparkline";
import { StatTile } from "@/components/cards/StatTile";
import { Section } from "@/components/cards/Section";
import { Empty, PageHeader } from "@/components/special/common";

export default function EnergyPage() {
  const entities = useEntityStore((s) => s.entities);
  const power = selectByDeviceClass(entities, "power");
  const energy = selectByDeviceClass(entities, "energy");
  const mainPower = power[0];

  const { data: hist } = useQuery({
    queryKey: ["history", mainPower?.entity_id, "48"],
    queryFn: () => fetchHistory(mainPower!.entity_id, 48),
    enabled: !!mainPower,
  });

  const bars = energy.slice(0, 7).map((e) => ({
    label: (e.attributes?.friendly_name || e.entity_id).split(" ").slice(-1)[0],
    value: parseFloat(e.state) || 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Energy" subtitle="Solar, grid & consumption" />

      {power.length === 0 && energy.length === 0 ? (
        <Empty msg="No energy or power sensors found." />
      ) : (
        <>
          {mainPower && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">
                    {mainPower.attributes?.friendly_name}
                  </p>
                  <p className="text-4xl font-bold text-fg">
                    {Math.round(parseFloat(mainPower.state)) || 0}
                    <span className="ml-1 text-lg text-muted">
                      {mainPower.attributes?.unit_of_measurement || "W"}
                    </span>
                  </p>
                </div>
                <Zap className="h-10 w-10 text-sidra-sky" />
              </div>
              {hist && hist.points.length > 1 && (
                <div className="mt-4">
                  <Sparkline points={hist.points} height={64} />
                </div>
              )}
            </Card>
          )}

          {bars.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-4 font-semibold text-fg">Energy today (kWh)</h3>
              <BarChart data={bars} unit=" kWh" accent="#34d399" />
            </Card>
          )}

          {power.length > 0 && (
            <Section title="Power now" count={power.length}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {power.map((e) => (
                  <StatTile key={e.entity_id} entity={e} />
                ))}
              </div>
            </Section>
          )}

          {energy.length > 0 && (
            <Section title="Energy today" count={energy.length}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {energy.map((e) => (
                  <StatTile key={e.entity_id} entity={e} />
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
