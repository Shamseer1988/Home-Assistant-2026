"use client";

import {
  Droplets,
  Lightbulb,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { domainOf } from "@/lib/ha";
import { selectPersons } from "@/lib/selectors";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";
import { Clock } from "./Clock";

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

function Chip({
  icon: Icon,
  label,
  accent = "text-muted",
}: {
  icon: LucideIcon;
  label: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-line/10 bg-fg/[0.04] px-3 py-2 text-sm font-semibold text-fg">
      <Icon className={`h-4 w-4 ${accent}`} />
      {label}
    </div>
  );
}

export function WelcomeHero() {
  const entities = useEntityStore((s) => s.entities);
  const list = Object.values(entities);
  const persons = selectPersons(entities);
  const name =
    persons[0]?.attributes?.friendly_name ||
    persons[0]?.entity_id?.split(".")[1] ||
    "Home";

  const lightsOn = list.filter(
    (e) => domainOf(e.entity_id) === "light" && e.state === "on"
  ).length;
  const alarm = list.find((e) => domainOf(e.entity_id) === "alarm_control_panel");
  const power = list.find(
    (e) => domainOf(e.entity_id) === "sensor" && e.attributes?.device_class === "power"
  );
  const humidity = list.find(
    (e) => domainOf(e.entity_id) === "sensor" && e.attributes?.device_class === "humidity"
  );

  return (
    <Card className="overflow-hidden p-6 text-center sm:p-8">
      <h1 className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-4xl font-black tracking-[0.35em] text-transparent sm:text-6xl">
        SIDRA
      </h1>
      <p className="mt-1 text-sm text-muted">Premium Smart Dashboard</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Chip icon={ShieldCheck} label={alarm ? cap(alarm.state) : "—"} accent="text-sidra-sky" />
        <Chip icon={Lightbulb} label={`${lightsOn} On`} accent="text-amber-400" />
        <Chip
          icon={Zap}
          label={power ? `${Math.round(parseFloat(power.state))} ${power.attributes?.unit_of_measurement || "W"}` : "—"}
          accent="text-sidra-sky"
        />
        <Chip
          icon={Droplets}
          label={humidity ? `${Math.round(parseFloat(humidity.state))}%` : "—"}
          accent="text-emerald-400"
        />
      </div>

      <p className="mt-7 text-2xl font-bold">
        <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
          {greeting()}, {name}
        </span>
      </p>
      <p className="mt-1 text-sm text-muted">Wishing you a peaceful day</p>
      <Clock />
    </Card>
  );
}
