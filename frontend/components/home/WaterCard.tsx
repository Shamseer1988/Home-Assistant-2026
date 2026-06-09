"use client";

import { Power } from "lucide-react";
import { callService } from "@/lib/api";
import { domainOf } from "@/lib/ha";
import { useSettings } from "@/lib/useSettings";
import { useEntityStore } from "@/store/entities";

const text = (e: { entity_id: string; attributes?: Record<string, any> }) =>
  `${e.entity_id} ${(e.attributes?.friendly_name || "").toLowerCase()}`.toLowerCase();

export function WaterCard() {
  const entities = useEntityStore((s) => s.entities);
  const list = Object.values(entities);

  // Admin-configured entities (Builder → Widgets) take priority over auto-detection.
  const { data: settings } = useSettings();
  const cfg = (settings?.water_entities as Record<string, string>) || {};
  const byId = (id?: string) => (id && entities[id] ? entities[id] : undefined);

  // Water sensors, excluding device diagnostics (battery / signal / linkquality)
  // which are also reported in % and would otherwise be mistaken for the level.
  const water = list.filter(
    (e) =>
      domainOf(e.entity_id) === "sensor" &&
      /water|tank|ultrason/.test(text(e)) &&
      e.attributes?.device_class !== "battery" &&
      !/battery|signal|rssi|linkquality|wifi/.test(text(e))
  );
  const unit = (s: any) => (s.attributes?.unit_of_measurement || "").toLowerCase();
  const pctS =
    byId(cfg.level) ||
    water.find((s) => unit(s) === "%" && /percent|level/.test(text(s))) ||
    water.find((s) => unit(s) === "%");
  const cmS =
    byId(cfg.cm) ||
    water.find((s) => unit(s) === "cm" && /level|height/.test(text(s)) && !/dist/.test(text(s)));
  const litS = byId(cfg.liters) || water.find((s) => /^l$|liter|litre/.test(unit(s)));
  const distS = byId(cfg.distance) || water.find((s) => /dist/.test(text(s)) && unit(s) === "cm");
  const motor =
    byId(cfg.motor) ||
    list.find(
      (e) => domainOf(e.entity_id) === "switch" && /water[_ ]?motor|motor|pump/.test(text(e))
    );

  const r = (s?: { state: string }) =>
    s && Number.isFinite(parseFloat(s.state)) ? Math.round(parseFloat(s.state)) : null;
  const pct = r(pctS);
  const fill = pct == null ? 0 : Math.min(100, Math.max(0, pct));
  const cm = r(cmS);
  const liters = r(litS);
  const dist = r(distS);
  const motorOn = motor?.state === "on";

  return (
    <div className="text-center">
      <p className="mb-3 text-sm text-muted">Water Level Monitor</p>
      <div className="relative mx-auto h-80 w-60 overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1226]">
        <div
          className="absolute inset-x-0 bottom-0 transition-[height] duration-500"
          style={{ height: `${fill}%`, background: "linear-gradient(to bottom,#34d399,#38bdf8)" }}
        />
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-1 p-4 text-white">
          <p className="text-6xl font-black drop-shadow-lg">{pct == null ? "--" : pct}%</p>
          {cm != null && <p className="text-lg font-bold drop-shadow">{cm} cm</p>}
          {liters != null && <p className="text-lg font-bold drop-shadow">{liters} L</p>}
          {dist != null && <p className="text-sm font-semibold drop-shadow">Dist {dist} cm</p>}

          {motor && (
            <button
              type="button"
              onClick={() =>
                callService("switch", "toggle", { entity_id: motor.entity_id }).catch(
                  console.error
                )
              }
              className={`mt-4 flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white backdrop-blur transition ${
                motorOn ? "bg-emerald-500/80 hover:bg-emerald-500" : "bg-white/20 hover:bg-white/30"
              }`}
            >
              <Power className="h-4 w-4" /> MOTOR {motorOn ? "ON" : "OFF"}
            </button>
          )}
        </div>
      </div>
      {!pctS && <p className="mt-3 text-sm text-muted">No water-tank sensor found.</p>}
    </div>
  );
}
