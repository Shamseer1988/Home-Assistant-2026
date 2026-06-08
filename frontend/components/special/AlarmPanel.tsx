"use client";

import { useState } from "react";
import {
  Home,
  Plane,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  type LucideIcon,
} from "lucide-react";
import { callService } from "@/lib/api";
import { friendlyName } from "@/lib/ha";
import type { HAEntity } from "@/lib/types";
import { Card } from "@/components/ui/Card";

const STATE_STYLE: Record<string, { label: string; color: string; Icon: LucideIcon }> = {
  disarmed: { label: "Disarmed", color: "text-emerald-400", Icon: ShieldOff },
  armed_home: { label: "Armed Home", color: "text-amber-400", Icon: ShieldCheck },
  armed_away: { label: "Armed Away", color: "text-amber-400", Icon: ShieldCheck },
  armed_night: { label: "Armed Night", color: "text-amber-400", Icon: ShieldCheck },
  triggered: { label: "Triggered", color: "text-rose-500", Icon: ShieldAlert },
  pending: { label: "Pending", color: "text-amber-400", Icon: ShieldAlert },
  arming: { label: "Arming", color: "text-amber-400", Icon: ShieldAlert },
};

export function AlarmPanel({ entity }: { entity: HAEntity }) {
  const eid = entity.entity_id;
  const [code, setCode] = useState("");
  const style = STATE_STYLE[entity.state] || {
    label: entity.state,
    color: "text-slate-300",
    Icon: ShieldCheck,
  };
  const Icon = style.Icon;
  const codeRequired = Boolean(entity.attributes?.code_format);

  const act = (service: string) => {
    const data: Record<string, unknown> = { entity_id: eid };
    if (code) data.code = code;
    callService("alarm_control_panel", service, data).catch(console.error);
  };

  const Btn = ({
    icon: BtnIcon,
    label,
    service,
  }: {
    icon: LucideIcon;
    label: string;
    service: string;
  }) => (
    <button
      type="button"
      onClick={() => act(service)}
      className="rounded-xl border border-white/10 bg-white/5 py-3 text-sm text-white transition hover:bg-white/10"
    >
      <BtnIcon className="mx-auto mb-1 h-5 w-5" />
      {label}
    </button>
  );

  return (
    <Card className="p-6">
      <div className="mb-5 flex flex-col items-center gap-2">
        <Icon className={`h-12 w-12 ${style.color}`} />
        <p className={`text-lg font-semibold ${style.color}`}>{style.label}</p>
        <p className="text-xs text-slate-500">{friendlyName(entity)}</p>
      </div>
      {codeRequired && (
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          type="password"
          placeholder="Code"
          className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-white outline-none"
        />
      )}
      <div className="grid grid-cols-3 gap-2">
        <Btn icon={ShieldOff} label="Disarm" service="alarm_disarm" />
        <Btn icon={Home} label="Home" service="alarm_arm_home" />
        <Btn icon={Plane} label="Away" service="alarm_arm_away" />
      </div>
    </Card>
  );
}
