"use client";

import { useEntityStore } from "@/store/entities";
import { selectAlarmPanels, selectSecuritySensors } from "@/lib/selectors";
import { AlarmPanel } from "@/components/special/AlarmPanel";
import { StatTile } from "@/components/cards/StatTile";
import { Section } from "@/components/cards/Section";
import { Empty, PageHeader } from "@/components/special/common";

export default function SecurityPage() {
  const entities = useEntityStore((s) => s.entities);
  const panels = selectAlarmPanels(entities);
  const sensors = selectSecuritySensors(entities);

  return (
    <div className="space-y-8">
      <PageHeader title="Security" />

      {panels.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
          {panels.map((p) => (
            <AlarmPanel key={p.entity_id} entity={p} />
          ))}
        </div>
      )}

      {sensors.length > 0 && (
        <Section title="Doors & motion" count={sensors.length}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sensors.map((s) => (
              <StatTile key={s.entity_id} entity={s} />
            ))}
          </div>
        </Section>
      )}

      {panels.length === 0 && sensors.length === 0 && (
        <Empty msg="No alarm panel or security sensors found." />
      )}
    </div>
  );
}
