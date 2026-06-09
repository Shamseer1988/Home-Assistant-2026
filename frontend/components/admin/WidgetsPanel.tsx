"use client";

import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { domainOf, friendlyName } from "@/lib/ha";
import { setSetting } from "@/lib/admin";
import { useSettings } from "@/lib/useSettings";
import type { HAEntity } from "@/lib/types";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";
import { EntityPickerModal } from "./EntityPickerModal";

export function WidgetsPanel() {
  const entities = useEntityStore((s) => s.entities);
  const { data } = useSettings();
  const qc = useQueryClient();
  const [picker, setPicker] = useState<{ key: string; current: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const get = (k: string) => data?.[k];
  const save = async (k: string, v: unknown) => {
    await setSetting(k, v);
    qc.invalidateQueries({ queryKey: ["settings"] });
  };
  const byDomain = (...ds: string[]) =>
    Object.values(entities)
      .filter((e) => ds.includes(domainOf(e.entity_id)))
      .sort((a, b) => friendlyName(a).localeCompare(friendlyName(b)));

  const water = (get("water_entities") as Record<string, string>) || {};

  // ---- reusable rows ----
  const Single = ({ label, k, options }: { label: string; k: string; options: HAEntity[] }) => (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted">{label}</span>
      <select
        value={(get(k) as string) || ""}
        onChange={(e) => save(k, e.target.value || undefined)}
        className="max-w-[60%] flex-1 rounded-lg border border-line/10 bg-fg/5 px-2 py-1.5 text-xs text-fg outline-none"
      >
        <option value="" className="bg-panel">
          — auto —
        </option>
        {options.map((o) => (
          <option key={o.entity_id} value={o.entity_id} className="bg-panel">
            {friendlyName(o)}
          </option>
        ))}
      </select>
    </div>
  );

  const Multi = ({ label, k, hint, icon }: { label: string; k: string; hint?: string; icon?: ReactNode }) => {
    const ids = (get(k) as string[]) || [];
    return (
      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-fg">
          {icon} {label}
        </p>
        <div className="flex flex-wrap gap-2">
          {ids.map((id) => (
            <span
              key={id}
              className="flex items-center gap-1 rounded-full border border-line/10 bg-fg/5 px-2.5 py-1 text-xs text-fg"
            >
              {entities[id] ? friendlyName(entities[id]) : id}
              <button type="button" onClick={() => save(k, ids.filter((x) => x !== id))}>
                <X className="h-3 w-3 text-rose-400" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setPicker({ key: k, current: ids })}
            className="flex items-center gap-1 rounded-full border border-dashed border-line/20 px-2.5 py-1 text-xs text-muted hover:bg-fg/5"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {ids.length === 0 && hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </div>
    );
  };

  return (
    <Card className="space-y-5 p-5">
      <div>
        <h2 className="font-semibold text-fg">Widgets</h2>
        <p className="text-xs text-muted">
          Pick exactly which entities each card/chip uses. Leave “auto” to detect automatically.
        </p>
      </div>

      <Multi label="Energy popup" k="energy_entities" hint="Defaults to all power sensors." />
      <Multi label="Lights popup" k="lights_entities" hint="Defaults to all lights." />
      <Multi label="Quick Controls" k="quick_entities" hint="Defaults to your first room toggles." />

      <div className="space-y-2 border-t border-line/10 pt-4">
        <Single label="Security panel" k="security_entity" options={byDomain("alarm_control_panel")} />
        <Single label="Climate dial" k="climate_entity" options={byDomain("climate")} />
        <Single label="Media player" k="media_entity" options={byDomain("media_player")} />
        <Single label="Home Mode" k="mode_entity" options={byDomain("input_select")} />
        <Single label="Alarm clock" k="alarm_entity" options={byDomain("input_datetime")} />
      </div>

      <div className="space-y-2 border-t border-line/10 pt-4">
        <p className="text-sm font-semibold text-fg">Water card</p>
        {(
          [
            ["Level %", "level", byDomain("sensor")],
            ["Level (cm)", "cm", byDomain("sensor")],
            ["Volume (L)", "liters", byDomain("sensor")],
            ["Distance", "distance", byDomain("sensor")],
            ["Motor switch", "motor", byDomain("switch")],
          ] as [string, string, HAEntity[]][]
        ).map(([label, k, options]) => (
          <div key={k} className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted">{label}</span>
            <select
              value={water[k] || ""}
              onChange={(e) => save("water_entities", { ...water, [k]: e.target.value || undefined })}
              className="max-w-[60%] flex-1 rounded-lg border border-line/10 bg-fg/5 px-2 py-1.5 text-xs text-fg outline-none"
            >
              <option value="" className="bg-panel">
                — auto —
              </option>
              {options.map((o) => (
                <option key={o.entity_id} value={o.entity_id} className="bg-panel">
                  {friendlyName(o)}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {picker && (
        <EntityPickerModal
          existing={new Set(picker.current)}
          busy={busy}
          onClose={() => setPicker(null)}
          onAdd={async (ids) => {
            setBusy(true);
            await save(picker.key, [...picker.current, ...ids]);
            setBusy(false);
            setPicker(null);
          }}
        />
      )}
    </Card>
  );
}
