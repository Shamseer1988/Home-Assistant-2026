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
import { DeviceTile } from "@/components/cards/DeviceTile";
import { StatTile } from "@/components/cards/StatTile";
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

export default function DashboardPage() {
  const entities = useEntityStore((s) => s.entities);
  const setSnapshot = useEntityStore((s) => s.setSnapshot);

  // Seed from REST in case the Socket.IO snapshot hasn't arrived yet.
  const { data, isError } = useQuery({
    queryKey: ["states"],
    queryFn: () => apiGet<HAEntity[]>("/api/ha/states"),
  });

  useEffect(() => {
    if (data && Object.keys(useEntityStore.getState().entities).length === 0) {
      setSnapshot(data);
    }
  }, [data, setSnapshot]);

  const list = Object.values(entities);
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
  const lightsOn = lights.filter((e) => e.state === "on").length;

  if (list.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        {isError ? (
          <>
            <p className="text-white">Can't reach the backend.</p>
            <p className="max-w-sm text-sm text-slate-400">
              Check that the Flask backend is running and that{" "}
              <code className="text-sidra-sky">NEXT_PUBLIC_API_URL</code> points
              to it.
            </p>
          </>
        ) : (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-sidra-sky" />
            <p className="text-sm text-slate-400">
              Connecting to Home Assistant…
            </p>
          </>
        )}
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
    </div>
  );
}
