"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  Pause,
  Play,
  Power,
  SkipBack,
  SkipForward,
  Square,
  Unlock,
} from "lucide-react";
import { callService, fetchHistory } from "@/lib/api";
import { domainOf } from "@/lib/ha";
import type { HAEntity } from "@/lib/types";
import { Slider } from "@/components/ui/Slider";
import { RadialGauge } from "@/components/ui/RadialGauge";
import { Sparkline } from "@/components/ui/Sparkline";

const call = (domain: string, service: string, data: Record<string, unknown>) =>
  callService(domain, service, data).catch(console.error);

// --------------------------------------------------------------- small pieces
function BigToggle({
  on,
  onClick,
  accent = "#59a0ff",
}: {
  on: boolean;
  onClick: () => void;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line/10 py-3 text-sm font-semibold text-fg transition hover:opacity-90"
      style={{ background: on ? accent : "rgba(255,255,255,0.05)" }}
    >
      <Power className="h-4 w-4" /> {on ? "On" : "Off"}
    </button>
  );
}

function RoundBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 w-14 items-center justify-center rounded-full border border-line/10 bg-fg/5 text-fg transition hover:bg-fg/10"
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
        active
          ? "bg-sidra-sky text-fg"
          : "border border-line/10 bg-fg/5 text-muted hover:bg-fg/10"
      }`}
    >
      {children}
    </button>
  );
}

// ------------------------------------------------------------------- lights
const COLOR_MODES_WITH_BRIGHTNESS = ["brightness", "color_temp", "hs", "rgb", "rgbw", "rgbww", "xy"];
const COLOR_MODES_WITH_COLOR = ["hs", "rgb", "rgbw", "rgbww", "xy"];
const PRESET_COLORS: [number, number, number][] = [
  [255, 147, 41],
  [255, 255, 255],
  [255, 87, 87],
  [87, 166, 255],
  [120, 255, 150],
  [200, 120, 255],
];

function LightControls({ entity }: { entity: HAEntity }) {
  const eid = entity.entity_id;
  const a = entity.attributes || {};
  const on = entity.state === "on";
  const modes: string[] = a.supported_color_modes || [];
  const brightness = a.brightness != null ? Math.round((a.brightness / 255) * 100) : 0;
  const hasBrightness =
    a.brightness != null || modes.some((m) => COLOR_MODES_WITH_BRIGHTNESS.includes(m));
  const hasColorTemp = modes.includes("color_temp") && a.min_color_temp_kelvin && a.max_color_temp_kelvin;
  const hasColor = modes.some((m) => COLOR_MODES_WITH_COLOR.includes(m));

  return (
    <div className="space-y-5">
      <BigToggle on={on} accent="#f59e0b" onClick={() => call("light", "toggle", { entity_id: eid })} />
      {on && hasBrightness && (
        <Slider
          label="Brightness"
          suffix="%"
          value={brightness}
          min={1}
          max={100}
          accent="#fbbf24"
          onCommit={(v) => call("light", "turn_on", { entity_id: eid, brightness_pct: v })}
        />
      )}
      {on && hasColorTemp && (
        <Slider
          label="Color temperature"
          suffix="K"
          value={a.color_temp_kelvin || a.min_color_temp_kelvin}
          min={a.min_color_temp_kelvin}
          max={a.max_color_temp_kelvin}
          step={50}
          accent="#fcd34d"
          onCommit={(v) => call("light", "turn_on", { entity_id: eid, color_temp_kelvin: v })}
        />
      )}
      {on && hasColor && (
        <div>
          <p className="mb-2 text-xs text-muted">Color</p>
          <div className="flex gap-2">
            {PRESET_COLORS.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => call("light", "turn_on", { entity_id: eid, rgb_color: c })}
                className="h-8 w-8 rounded-full border border-line/20 transition hover:scale-110"
                style={{ background: `rgb(${c[0]},${c[1]},${c[2]})` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------- fan
function FanControls({ entity }: { entity: HAEntity }) {
  const eid = entity.entity_id;
  const on = entity.state === "on";
  const pct = entity.attributes?.percentage ?? 0;
  return (
    <div className="space-y-5">
      <BigToggle on={on} accent="#06b6d4" onClick={() => call("fan", "toggle", { entity_id: eid })} />
      {on && (
        <Slider
          label="Speed"
          suffix="%"
          value={pct}
          min={0}
          max={100}
          accent="#22d3ee"
          onCommit={(v) => call("fan", "set_percentage", { entity_id: eid, percentage: v })}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------- climate
function ClimateControls({ entity }: { entity: HAEntity }) {
  const eid = entity.entity_id;
  const a = entity.attributes || {};
  const target = a.temperature ?? 22;
  const current = a.current_temperature;
  const min = a.min_temp ?? 7;
  const max = a.max_temp ?? 35;
  const step = a.target_temp_step ?? 0.5;
  const modes: string[] = a.hvac_modes || [];

  const setTemp = (t: number) =>
    call("climate", "set_temperature", {
      entity_id: eid,
      temperature: Math.min(max, Math.max(min, Math.round(t * 10) / 10)),
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center">
        <RadialGauge
          value={target}
          min={min}
          max={max}
          unit="°"
          sub={current != null ? `Now ${current}°` : entity.state}
        />
        <div className="mt-3 flex items-center gap-5">
          <RoundBtn onClick={() => setTemp(target - step)}>
            <ChevronDown className="h-6 w-6" />
          </RoundBtn>
          <RoundBtn onClick={() => setTemp(target + step)}>
            <ChevronUp className="h-6 w-6" />
          </RoundBtn>
        </div>
      </div>
      {modes.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {modes.map((m) => (
            <Chip
              key={m}
              active={entity.state === m}
              onClick={() => call("climate", "set_hvac_mode", { entity_id: eid, hvac_mode: m })}
            >
              {m}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------- cover
function CoverControls({ entity }: { entity: HAEntity }) {
  const eid = entity.entity_id;
  const pos = entity.attributes?.current_position;
  const btn = (label: string, icon: ReactNode, service: string) => (
    <button
      type="button"
      onClick={() => call("cover", service, { entity_id: eid })}
      className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-line/10 bg-fg/5 py-3 text-xs text-muted transition hover:bg-fg/10"
    >
      {icon}
      {label}
    </button>
  );
  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        {btn("Open", <ChevronUp className="h-5 w-5" />, "open_cover")}
        {btn("Stop", <Square className="h-5 w-5" />, "stop_cover")}
        {btn("Close", <ChevronDown className="h-5 w-5" />, "close_cover")}
      </div>
      {pos != null && (
        <Slider
          label="Position"
          suffix="%"
          value={pos}
          min={0}
          max={100}
          onCommit={(v) => call("cover", "set_cover_position", { entity_id: eid, position: v })}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------- media_player
function MediaControls({ entity }: { entity: HAEntity }) {
  const eid = entity.entity_id;
  const a = entity.attributes || {};
  const vol = Math.round((a.volume_level ?? 0) * 100);
  const playing = entity.state === "playing";
  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="truncate font-semibold text-fg">{a.media_title || entity.state}</p>
        {a.media_artist && <p className="truncate text-sm text-muted">{a.media_artist}</p>}
      </div>
      <div className="flex items-center justify-center gap-6">
        <button type="button" onClick={() => call("media_player", "media_previous_track", { entity_id: eid })} className="text-muted hover:text-fg">
          <SkipBack className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => call("media_player", "media_play_pause", { entity_id: eid })}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sidra-blue to-sidra-sky text-fg"
        >
          {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </button>
        <button type="button" onClick={() => call("media_player", "media_next_track", { entity_id: eid })} className="text-muted hover:text-fg">
          <SkipForward className="h-6 w-6" />
        </button>
      </div>
      <Slider
        label="Volume"
        suffix="%"
        value={vol}
        min={0}
        max={100}
        onCommit={(v) => call("media_player", "volume_set", { entity_id: eid, volume_level: v / 100 })}
      />
    </div>
  );
}

// -------------------------------------------------------------------- lock
function LockControls({ entity }: { entity: HAEntity }) {
  const eid = entity.entity_id;
  const locked = entity.state === "locked";
  return (
    <button
      type="button"
      onClick={() => call("lock", locked ? "unlock" : "lock", { entity_id: eid })}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line/10 bg-fg/5 py-4 font-semibold text-fg transition hover:bg-fg/10"
    >
      {locked ? <Lock className="h-5 w-5 text-emerald-400" /> : <Unlock className="h-5 w-5 text-amber-400" />}
      {locked ? "Locked — tap to unlock" : "Unlocked — tap to lock"}
    </button>
  );
}

// ----------------------------------------------------------- toggle / activate
function ToggleControls({ entity }: { entity: HAEntity }) {
  const eid = entity.entity_id;
  const domain = domainOf(eid);
  const on = entity.state === "on";
  return <BigToggle on={on} onClick={() => call(domain, "toggle", { entity_id: eid })} />;
}

function ActivateControls({ entity }: { entity: HAEntity }) {
  const eid = entity.entity_id;
  const domain = domainOf(eid);
  const service = domain === "button" ? "press" : "turn_on";
  const label = domain === "scene" ? "Activate scene" : domain === "script" ? "Run script" : "Press";
  return (
    <button
      type="button"
      onClick={() => call(domain, service, { entity_id: eid })}
      className="w-full rounded-2xl bg-gradient-to-br from-sidra-blue to-sidra-sky py-3 text-sm font-semibold text-fg transition hover:opacity-90"
    >
      {label}
    </button>
  );
}

// ------------------------------------------------------------------ sensors
const HIDDEN_ATTRS = new Set(["friendly_name", "icon", "supported_features", "attribution", "device_class"]);

function SensorDetails({ entity }: { entity: HAEntity }) {
  const numeric = !Number.isNaN(parseFloat(entity.state));
  const unit = entity.attributes?.unit_of_measurement;
  const { data, isLoading } = useQuery({
    queryKey: ["history", entity.entity_id],
    queryFn: () => fetchHistory(entity.entity_id, 24),
    enabled: numeric,
  });

  const attrs = Object.entries(entity.attributes || {})
    .filter(([k, v]) => !HIDDEN_ATTRS.has(k) && (typeof v === "string" || typeof v === "number"))
    .slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-4xl font-bold text-fg">
          {entity.state}
          {unit && <span className="ml-1 text-lg text-muted">{unit}</span>}
        </p>
      </div>
      {numeric && (
        <div className="rounded-2xl border border-line/10 bg-fg/[0.03] p-4">
          <p className="mb-2 text-xs text-muted">Last 24 hours</p>
          {isLoading ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted" />
          ) : (
            <Sparkline points={data?.points || []} />
          )}
        </div>
      )}
      {attrs.length > 0 && (
        <div className="space-y-1.5">
          {attrs.map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="capitalize text-muted">{k.replace(/_/g, " ")}</span>
              <span className="text-fg">{String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ dispatch
export function DomainControls({ entity }: { entity: HAEntity }) {
  const domain = domainOf(entity.entity_id);
  switch (domain) {
    case "light":
      return <LightControls entity={entity} />;
    case "fan":
      return <FanControls entity={entity} />;
    case "climate":
      return <ClimateControls entity={entity} />;
    case "cover":
      return <CoverControls entity={entity} />;
    case "media_player":
      return <MediaControls entity={entity} />;
    case "lock":
      return <LockControls entity={entity} />;
    case "switch":
    case "input_boolean":
      return <ToggleControls entity={entity} />;
    case "scene":
    case "script":
    case "button":
      return <ActivateControls entity={entity} />;
    default:
      return <SensorDetails entity={entity} />;
  }
}
