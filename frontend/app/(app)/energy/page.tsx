"use client";

import { useEntityStore } from "@/store/entities";
import { selectByDeviceClass } from "@/lib/selectors";
import { StatTile } from "@/components/cards/StatTile";
import { Section } from "@/components/cards/Section";
import { Empty, PageHeader } from "@/components/special/common";

export default function EnergyPage() {
  const entities = useEntityStore((s) => s.entities);
  const power = selectByDeviceClass(entities, "power");
  const energy = selectByDeviceClass(entities, "energy");

  return (
    <div className="space-y-8">
      <PageHeader title="Energy" subtitle="Solar, grid & consumption" />
      {power.length === 0 && energy.length === 0 ? (
        <Empty msg="No energy or power sensors found." />
      ) : (
        <>
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
