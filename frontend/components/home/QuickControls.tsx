"use client";

import { domainOf } from "@/lib/ha";
import { useDashboard } from "@/lib/useDashboard";
import { useConfiguredList } from "@/lib/useWidget";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";
import { DeviceTile } from "@/components/cards/DeviceTile";

const TOGGLE = ["light", "switch", "fan", "input_boolean"];

export function QuickControls() {
  const { data } = useDashboard();
  const entities = useEntityStore((s) => s.entities);
  const configured = useConfiguredList("quick_entities");

  let tiles;
  if (configured.length > 0) {
    // Admin-chosen entities (Builder → Widgets).
    tiles = configured.slice(0, 8);
  } else {
    // Fall back to the curated rooms, else any toggleable entity.
    let ids: string[] = [];
    if (data) {
      for (const section of data.sections) {
        for (const it of section.items) {
          if (it.entity_id && TOGGLE.includes(domainOf(it.entity_id))) ids.push(it.entity_id);
        }
      }
    }
    if (ids.length === 0) {
      ids = Object.keys(entities).filter((id) => TOGGLE.includes(domainOf(id)));
    }
    tiles = ids
      .slice(0, 4)
      .map((id) => entities[id])
      .filter(Boolean);
  }
  if (tiles.length === 0) return null;

  return (
    <Card className="p-5">
      <p className="mb-3 text-sm font-semibold text-fg">Quick Controls</p>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((e) => (
          <DeviceTile key={e.entity_id} entity={e} />
        ))}
      </div>
    </Card>
  );
}
