"use client";

import { useEntityStore } from "@/store/entities";
import {
  selectPrayerTimes,
  selectSystem,
  selectWaterTank,
} from "@/lib/selectors";
import { SERVICE_LINKS } from "@/lib/services";
import { WaterTank } from "@/components/special/WaterTank";
import { PrayerTimes } from "@/components/special/PrayerTimes";
import { ServiceEmbed } from "@/components/special/ServiceEmbed";
import { StatTile } from "@/components/cards/StatTile";
import { Section } from "@/components/cards/Section";
import { PageHeader } from "@/components/special/common";

export default function MorePage() {
  const entities = useEntityStore((s) => s.entities);
  const tank = selectWaterTank(entities);
  const prayers = selectPrayerTimes(entities);
  const system = selectSystem(entities);

  return (
    <div className="space-y-8">
      <PageHeader title="More" subtitle="House & services" />

      {(tank.length > 0 || prayers.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {tank.length > 0 && <WaterTank sensors={tank} />}
          {prayers.length > 0 && <PrayerTimes sensors={prayers} />}
        </div>
      )}

      {system.length > 0 && (
        <Section title="System" count={system.length}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {system.map((s) => (
              <StatTile key={s.entity_id} entity={s} />
            ))}
          </div>
        </Section>
      )}

      {SERVICE_LINKS.length > 0 && (
        <Section title="Services">
          <div className="grid gap-4 lg:grid-cols-2">
            {SERVICE_LINKS.map((s) => (
              <ServiceEmbed key={s.name} service={s} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
