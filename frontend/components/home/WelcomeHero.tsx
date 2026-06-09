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
import { useAuth } from "@/lib/useAuth";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { EntityTile } from "@/components/cards/EntityTile";
import { StatTile } from "@/components/cards/StatTile";
import { AlarmPanel } from "@/components/special/AlarmPanel";
import { WaterCard } from "./WaterCard";

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

const nameText = (e: { entity_id: string; attributes?: Record<string, any> }) =>
  `${e.entity_id} ${(e.attributes?.friendly_name || "").toLowerCase()}`.toLowerCase();

type Popup = "security" | "lights" | "energy" | "water" | null;

function ChipBtn({
  icon: Icon,
  label,
  accent,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-2xl border border-line/10 bg-fg/[0.05] px-3 py-2 text-sm font-semibold text-fg transition hover:bg-fg/10"
    >
      <Icon className={`h-4 w-4 ${accent}`} />
      {label}
    </button>
  );
}

export function WelcomeHero() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { user } = useAuth();
  const entities = useEntityStore((s) => s.entities);
  const list = Object.values(entities);
  const [popup, setPopup] = useState<Popup>(null);

  const userName = user?.username ? cap(user.username) : "Home";

  const lights = list.filter((e) => domainOf(e.entity_id) === "light");
  const lightsOn = lights.filter((e) => e.state === "on").length;
  const alarm = list.find((e) => domainOf(e.entity_id) === "alarm_control_panel");
  const powerSensors = list.filter(
    (e) =>
      domainOf(e.entity_id) === "sensor" &&
      e.attributes?.device_class === "power" &&
      Number.isFinite(parseFloat(e.state))
  );
  const power = powerSensors[0];
  const waterPct = list.find(
    (e) =>
      domainOf(e.entity_id) === "sensor" &&
      /water|tank/.test(nameText(e)) &&
      e.attributes?.unit_of_measurement === "%"
  );

  const time = now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";
  const date = now
    ? now.toLocaleDateString([], { weekday: "short", month: "short", day: "2-digit" }).toUpperCase()
    : "";

  return (
    <Card className="flex flex-col p-6 sm:p-7">
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

      <p className="mt-4 text-xl font-bold sm:text-2xl">
        <span className="bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
          {greeting()}, {userName}
        </span>
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <ChipBtn
          icon={ShieldCheck}
          label={alarm ? cap(alarm.state) : "Secure"}
          accent="text-sidra-sky"
          onClick={() => setPopup("security")}
        />
        <ChipBtn
          icon={Lightbulb}
          label={`${lightsOn} On`}
          accent="text-amber-400"
          onClick={() => setPopup("lights")}
        />
        <ChipBtn
          icon={Zap}
          label={power ? `${Math.round(parseFloat(power.state))} ${power.attributes?.unit_of_measurement || "W"}` : "—"}
          accent="text-sidra-sky"
          onClick={() => setPopup("energy")}
        />
        <ChipBtn
          icon={Droplets}
          label={waterPct ? `${Math.round(parseFloat(waterPct.state))}%` : "Water"}
          accent="text-emerald-400"
          onClick={() => setPopup("water")}
        />
      </div>

      {popup === "security" && (
        <Modal title="Security" onClose={() => setPopup(null)}>
          {alarm ? (
            <AlarmPanel entity={alarm} />
          ) : (
            <p className="py-6 text-center text-sm text-muted">No alarm panel found.</p>
          )}
        </Modal>
      )}
      {popup === "lights" && (
        <Modal title={`Lights — ${lightsOn} on`} onClose={() => setPopup(null)}>
          <div className="grid grid-cols-2 gap-3">
            {lights.map((e) => (
              <EntityTile key={e.entity_id} entityId={e.entity_id} />
            ))}
          </div>
        </Modal>
      )}
      {popup === "energy" && (
        <Modal title="Energy" onClose={() => setPopup(null)}>
          <div className="grid grid-cols-2 gap-3">
            {powerSensors.map((e) => (
              <StatTile key={e.entity_id} entity={e} />
            ))}
            {powerSensors.length === 0 && (
              <p className="col-span-2 py-6 text-center text-sm text-muted">No power sensors.</p>
            )}
          </div>
        </Modal>
      )}
      {popup === "water" && (
        <Modal title="Water" onClose={() => setPopup(null)}>
          <WaterCard />
        </Modal>
      )}
    </Card>
  );
}
