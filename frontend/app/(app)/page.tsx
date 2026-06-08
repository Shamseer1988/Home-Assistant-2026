"use client";

import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Fan as FanIcon,
  Lightbulb,
  Loader2,
  Power,
  type LucideIcon,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { domainOf, friendlyName } from "@/lib/ha";
import type { HAEntity } from "@/lib/types";
import { useEntityStore } from "@/store/entities";
import { useDashboard } from "@/lib/useDashboard";
import { DeviceTile } from "@/components/cards/DeviceTile";
import { StatTile } from "@/components/cards/StatTile";
import { RoomSection } from "@/components/cards/RoomSection";
import { Section } from "@/components/cards/Section";
import { Card } from "@/components/ui/Card";

function Grid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
        <Icon className="h-5 w-5 text-sidra-sky" />
      </span>
      <div>
        <p className="text-lg font-bold leading-none text-white">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{label}</p>
      </div>
    </Card>
  );
}

/** Fallback view (group by domain) used until rooms are imported. */
function DomainFallback({ list }: { list: HAEntity[] }) {
  const byDomain = (d: string) =>
    list
      .filter((e) => domainOf(e.entity_id) === d)
      .sort((a, b) => friendlyName(a).localeCompare(friendlyName(b)));

  const lights = byDomain("light");
  const switches = byDomain("switch");
  const fans = byDomain("fan");
  const sensors = byDomain("sensor")
    .filter(
      (e) =>
        e.attributes?.unit_of_measurement &&
        e.state !== "unknown" &&
        e.state !== "unavailable"
    )
    .slice(0, 18);

  return (
    <>
      {lights.length > 0 && (
        <Section title="Lights" count={lights.length}>
          <Grid>
            {lights.map((e) => (
              <DeviceTile key={e.entity_id} entity={e} />
            ))}
          </Grid>
        </Section>
      )}
      {switches.length > 0 && (
        <Section title="Switches" count={switches.length}>
          <Grid>
            {switches.map((e) => (
              <DeviceTile key={e.entity_id} entity={e} />
            ))}
          </Grid>
        </Section>
      )}
      {fans.length > 0 && (
        <Section title="Fans" count={fans.length}>
          <Grid>
            {fans.map((e) => (
              <DeviceTile key={e.entity_id} entity={e} />
            ))}
          </Grid>
        </Section>
      )}
      {sensors.length > 0 && (
        <Section title="Sensors" count={sensors.length}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sensors.map((e) => (
              <StatTile key={e.entity_id} entity={e} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

export default function DashboardPage() {
  const entities = useEntityStore((s) => s.entities);
  const setSnapshot = useEntityStore((s) => s.setSnapshot);

  // Seed the store from REST if the Socket.IO snapshot hasn't landed yet.
  const { data: states } = useQuery({
    queryKey: ["states"],
    queryFn: () => apiGet<HAEntity[]>("/api/ha/states"),
  });
  const { data: dashboard, isLoading: dashLoading } = useDashboard();

  useEffect(() => {
    if (states && Object.keys(useEntityStore.getState().entities).length === 0) {
      setSnapshot(states);
    }
  }, [states, setSnapshot]);

  const list = Object.values(entities);
  const lights = list.filter((e) => domainOf(e.entity_id) === "light");
  const lightsOn = lights.filter((e) => e.state === "on").length;
  const switches = list.filter((e) => domainOf(e.entity_id) === "switch");
  const fans = list.filter((e) => domainOf(e.entity_id) === "fan");

  const hasRooms =
    !!dashboard && dashboard.sections.some((s) => s.items.length > 0);

  if (list.length === 0 && dashLoading) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-sidra-sky" />
        <p className="text-sm text-slate-400">Loading your home…</p>
      </Card>
    );
  }

  return (
    <div className="space-y-9">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Entities" value={list.length} icon={Activity} />
        <Stat
          label="Lights on"
          value={`${lightsOn}/${lights.length}`}
          icon={Lightbulb}
        />
        <Stat label="Switches" value={switches.length} icon={Power} />
        <Stat label="Fans" value={fans.length} icon={FanIcon} />
      </div>

      {hasRooms ? (
        dashboard!.sections.map((section) => (
          <RoomSection key={section.id} section={section} />
        ))
      ) : (
        <DomainFallback list={list} />
      )}
    </div>
  );
}
