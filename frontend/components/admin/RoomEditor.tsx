"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  addItems,
  deleteSection,
  reorderItems,
  updateSection,
} from "@/lib/admin";
import { roomIcon } from "@/lib/roomIcon";
import type { AdminSection } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { ItemRow } from "./ItemRow";
import { EntityPickerModal } from "./EntityPickerModal";

export function RoomEditor({
  section,
  allSections,
  index,
  total,
  onMoveRoom,
  run,
}: {
  section: AdminSection;
  allSections: AdminSection[];
  index: number;
  total: number;
  onMoveRoom: (dir: number) => void;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const Icon = roomIcon(section.name);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(section.name);
  const [picker, setPicker] = useState(false);
  const [pickerBusy, setPickerBusy] = useState(false);

  const moveItem = (idx: number, dir: number) => {
    const ids = section.items.map((i) => i.id);
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    run(() => reorderItems(section.id, ids));
  };

  const onAdd = async (ids: string[]) => {
    setPickerBusy(true);
    await run(() => addItems(section.id, ids));
    setPickerBusy(false);
    setPicker(false);
  };

  const existing = new Set(
    section.items.map((i) => i.entity_id).filter(Boolean) as string[]
  );

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5">
          <Icon className="h-4 w-4 text-sidra-sky" />
        </span>

        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white outline-none"
            />
            <IconButton
              className="text-emerald-400"
              onClick={() => {
                if (name.trim()) run(() => updateSection(section.id, { name: name.trim() }));
                setEditing(false);
              }}
            >
              <Check className="h-4 w-4" />
            </IconButton>
            <IconButton
              onClick={() => {
                setName(section.name);
                setEditing(false);
              }}
            >
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        ) : (
          <>
            <h3 className="flex-1 truncate font-semibold text-white">
              {section.name}
            </h3>
            <span className="mr-1 text-xs text-slate-400">
              {section.items.length}
            </span>
            <IconButton title="Move up" disabled={index === 0} onClick={() => onMoveRoom(-1)}>
              <ArrowUp className="h-4 w-4" />
            </IconButton>
            <IconButton
              title="Move down"
              disabled={index === total - 1}
              onClick={() => onMoveRoom(1)}
            >
              <ArrowDown className="h-4 w-4" />
            </IconButton>
            <IconButton title="Rename room" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
            </IconButton>
            <IconButton
              title="Delete room"
              onClick={() => {
                if (
                  window.confirm(
                    `Delete “${section.name}” and its ${section.items.length} tiles?`
                  )
                ) {
                  run(() => deleteSection(section.id));
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
            </IconButton>
          </>
        )}
      </div>

      <div className="space-y-1.5">
        {section.items.map((it, i) => (
          <ItemRow
            key={it.id}
            item={it}
            sections={allSections}
            index={i}
            total={section.items.length}
            onMove={(dir) => moveItem(i, dir)}
            run={run}
          />
        ))}
        {section.items.length === 0 && (
          <p className="px-1 py-2 text-sm text-slate-500">No tiles yet.</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setPicker(true)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 py-2 text-sm text-slate-300 transition hover:bg-white/[0.04]"
      >
        <Plus className="h-4 w-4" /> Add entities
      </button>

      {picker && (
        <EntityPickerModal
          existing={existing}
          onClose={() => setPicker(false)}
          onAdd={onAdd}
          busy={pickerBusy}
        />
      )}
    </Card>
  );
}
