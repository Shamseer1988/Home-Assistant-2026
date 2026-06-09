"use client";

import { useState } from "react";
import { domainOf } from "@/lib/ha";
import { useDashboard } from "@/lib/useDashboard";
import { useEntityStore } from "@/store/entities";
import { Modal } from "@/components/ui/Modal";
import { EntityTile } from "@/components/cards/EntityTile";

export function LightsPopup({ onClose }: { onClose: () => void }) {
  const entities = useEntityStore((s) => s.entities);
  const { data } = useDashboard();
  const [room, setRoom] = useState("All");

  // entity_id -> room name (from the admin-curated layout)
  const roomOf: Record<string, string> = {};
  if (data) {
    for (const section of data.sections) {
      for (const it of section.items) {
        if (it.entity_id) roomOf[it.entity_id] = section.name;
      }
    }
  }

  const onLights = Object.values(entities).filter(
    (e) => domainOf(e.entity_id) === "light" && e.state === "on"
  );
  const roomsWithOn = Array.from(
    new Set(onLights.map((e) => roomOf[e.entity_id]).filter(Boolean))
  );
  const filtered =
    room === "All" ? onLights : onLights.filter((e) => roomOf[e.entity_id] === room);

  return (
    <Modal title={`Lights On — ${onLights.length}`} onClose={onClose}>
      {roomsWithOn.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {["All", ...roomsWithOn].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoom(r)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                room === r
                  ? "bg-sidra-sky text-white"
                  : "border border-line/10 bg-fg/5 text-muted hover:bg-fg/10"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      )}
      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">No lights on.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((e) => (
            <EntityTile key={e.entity_id} entityId={e.entity_id} />
          ))}
        </div>
      )}
    </Modal>
  );
}
