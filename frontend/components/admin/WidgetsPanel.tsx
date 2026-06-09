"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Droplets, Plus, X, Zap } from "lucide-react";
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
  const [pickEnergy, setPickEnergy] = useState(false);
  const [busy, setBusy] = useState(false);

  const energyIds: string[] = (data?.energy_entities as string[]) || [];
  const water = (data?.water_entities as Record<string, string>) || {};

  const save = async (key: string, value: unknown) => {
    await setSetting(key, value);
    qc.invalidateQueries({ queryKey: ["settings"] });
  };

  const sensors = Object.values(entities)
    .filter((e) => domainOf(e.entity_id) === "sensor")
    .sort((a, b) => friendlyName(a).localeCompare(friendlyName(b)));
  const switches = Object.values(entities)
    .filter((e) => domainOf(e.entity_id) === "switch")
    .sort((a, b) => friendlyName(a).localeCompare(friendlyName(b)));

  const WaterSelect = ({
    label,
    k,
    options,
  }: {
    label: string;
    k: string;
    options: HAEntity[];
  }) => (
    <div className="flex items-center justify-between gap-2">
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
  );

  return (
    <Card className="space-y-5 p-5">
      <h2 className="font-semibold text-fg">Widgets</h2>

      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-fg">
          <Zap className="h-4 w-4 text-sidra-sky" /> Energy popup entities
        </p>
        <div className="flex flex-wrap gap-2">
          {energyIds.map((id) => (
            <span
              key={id}
              className="flex items-center gap-1 rounded-full border border-line/10 bg-fg/5 px-2.5 py-1 text-xs text-fg"
            >
              {entities[id] ? friendlyName(entities[id]) : id}
              <button type="button" onClick={() => save("energy_entities", energyIds.filter((x) => x !== id))}>
                <X className="h-3 w-3 text-rose-400" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setPickEnergy(true)}
            className="flex items-center gap-1 rounded-full border border-dashed border-line/20 px-2.5 py-1 text-xs text-muted hover:bg-fg/5"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {energyIds.length === 0 && (
          <p className="mt-1 text-xs text-muted">Defaults to all power sensors.</p>
        )}
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Droplets className="h-4 w-4 text-emerald-400" /> Water card entities
        </p>
        <WaterSelect label="Level %" k="level" options={sensors} />
        <WaterSelect label="Level (cm)" k="cm" options={sensors} />
        <WaterSelect label="Volume (L)" k="liters" options={sensors} />
        <WaterSelect label="Distance" k="distance" options={sensors} />
        <WaterSelect label="Motor switch" k="motor" options={switches} />
      </div>

      {pickEnergy && (
        <EntityPickerModal
          existing={new Set(energyIds)}
          busy={busy}
          onClose={() => setPickEnergy(false)}
          onAdd={async (ids) => {
            setBusy(true);
            await save("energy_entities", [...energyIds, ...ids]);
            setBusy(false);
            setPickEnergy(false);
          }}
        />
      )}
    </Card>
  );
}
