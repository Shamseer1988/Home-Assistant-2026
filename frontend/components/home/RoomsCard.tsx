"use client";

import { useState } from "react";
import { cardSpan } from "@/lib/cardTypes";
import { isOn } from "@/lib/ha";
import { roomIcon } from "@/lib/roomIcon";
import { useDashboard } from "@/lib/useDashboard";
import type { DashSection } from "@/lib/types";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { DashCard } from "@/components/cards/DashCard";

function RoomChip({ section, onOpen }: { section: DashSection; onOpen: () => void }) {
  const Icon = roomIcon(section.name);
  const onCount = useEntityStore((s) =>
    section.items.reduce((n, it) => {
      const e = it.entity_id ? s.entities[it.entity_id] : undefined;
      return n + (e && isOn(e) ? 1 : 0);
    }, 0)
  );
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center gap-3 rounded-2xl border border-line/10 bg-fg/[0.03] p-3 text-left transition hover:bg-fg/[0.06]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fg/5">
        <Icon className="h-5 w-5 text-sidra-sky" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-fg">{section.name}</p>
        <p className="text-xs text-muted">
          {onCount > 0 ? `${onCount} on` : `${section.items.length} items`}
        </p>
      </div>
    </button>
  );
}

export function RoomsCard() {
  const { data } = useDashboard();
  const [room, setRoom] = useState<DashSection | null>(null);
  const sections = (data?.sections || []).filter((s) => s.items.length > 0);
  if (sections.length === 0) return null;

  return (
    <Card className="p-5">
      <h3 className="mb-3 font-semibold text-fg">Rooms</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {sections.map((s) => (
          <RoomChip key={s.id} section={s} onOpen={() => setRoom(s)} />
        ))}
      </div>

      {room && (
        <Modal title={room.name} onClose={() => setRoom(null)}>
          <div className="grid grid-cols-2 gap-3">
            {room.items.map((it) => (
              <div key={it.id} className={cardSpan(it.type, it.config) ? "col-span-2" : ""}>
                <DashCard item={it} />
              </div>
            ))}
          </div>
        </Modal>
      )}
    </Card>
  );
}
