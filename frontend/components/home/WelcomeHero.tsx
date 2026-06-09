"use client";

import { useEffect, useState } from "react";
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

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

function Chip({ icon: Icon, label, accent }: { icon: LucideIcon; label: string; accent: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-line/10 bg-fg/[0.05] px-3 py-2 text-sm font-semibold text-fg">
      <Icon className={`h-4 w-4 ${accent}`} />
      {label}
    </div>
  );
}

export function WelcomeHero() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const entities = useEntityStore((s) => s.entities);
  const list = Object.values(entities);
  const persons = selectPersons(entities);
  const name =
    persons[0]?.attributes?.friendly_name || persons[0]?.entity_id?.split(".")[1] || "Home";

  const lightsOn = list.filter((e) => domainOf(e.entity_id) === "light" && e.state === "on").length;
  const alarm = list.find((e) => domainOf(e.entity_id) === "alarm_control_panel");
  const power = list.find(
    (e) => domainOf(e.entity_id) === "sensor" && e.attributes?.device_class === "power"
  );
  const humidity = list.find(
    (e) => domainOf(e.entity_id) === "sensor" && e.attributes?.device_class === "humidity"
  );

  const time = now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";
  const date = now
    ? now.toLocaleDateString([], { weekday: "short", month: "short", day: "2-digit" }).toUpperCase()
    : "";

  return (
    <Card className="flex h-full flex-col justify-between p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-400 bg-clip-text text-3xl font-black tracking-[0.28em] text-transparent sm:text-4xl">
            SIDRA
          </h1>
          <p className="mt-1 text-xs text-muted">Premium Smart Dashboard</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{time}</p>
          <p className="mt-0.5 text-xs font-semibold tracking-[0.2em] text-muted">{date}</p>
        </div>
      </div>

      <p className="mt-5 text-xl font-bold sm:text-2xl">
        <span className="bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
          {greeting()}, {name}
        </span>
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip icon={ShieldCheck} label={alarm ? cap(alarm.state) : "Secure"} accent="text-sidra-sky" />
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
    </Card>
  );
}
