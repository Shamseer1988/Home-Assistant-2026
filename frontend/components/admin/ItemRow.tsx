"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Pencil, Trash2, X } from "lucide-react";
import { deleteItem, updateItem } from "@/lib/admin";
import type { AdminItem, AdminSection } from "@/lib/types";
import { IconButton } from "@/components/ui/IconButton";

export function ItemRow({
  item,
  sections,
  index,
  total,
  onMove,
  run,
}: {
  item: AdminItem;
  sections: AdminSection[];
  index: number;
  total: number;
  onMove: (dir: number) => void;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label || "");
  const display = item.label || item.live_name || item.entity_id || "";

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-line/10 bg-fg/[0.03] px-2.5 py-1.5">
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={item.live_name || item.entity_id || ""}
          className="flex-1 rounded-lg border border-line/10 bg-fg/5 px-2 py-1 text-sm text-fg outline-none"
        />
        <IconButton
          className="text-emerald-400"
          onClick={() => {
            run(() => updateItem(item.id, { label: label || null }));
            setEditing(false);
          }}
        >
          <Check className="h-4 w-4" />
        </IconButton>
        <IconButton
          onClick={() => {
            setLabel(item.label || "");
            setEditing(false);
          }}
        >
          <X className="h-4 w-4" />
        </IconButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border border-line/10 bg-fg/[0.03] px-2.5 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-fg">{display}</p>
        <p className="truncate text-[11px] text-muted">{item.entity_id}</p>
      </div>
      <IconButton title="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
        <ArrowUp className="h-4 w-4" />
      </IconButton>
      <IconButton
        title="Move down"
        disabled={index === total - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown className="h-4 w-4" />
      </IconButton>
      <select
        title="Move to room"
        value={item.section_id}
        onChange={(e) => {
          const sid = Number(e.target.value);
          if (sid !== item.section_id) run(() => updateItem(item.id, { section_id: sid }));
        }}
        className="max-w-[6.5rem] rounded-lg border border-line/10 bg-fg/5 px-1.5 py-1 text-xs text-muted outline-none"
      >
        {sections.map((s) => (
          <option key={s.id} value={s.id} className="bg-panel">
            {s.name}
          </option>
        ))}
      </select>
      <IconButton title="Rename" onClick={() => setEditing(true)}>
        <Pencil className="h-4 w-4" />
      </IconButton>
      <IconButton title="Remove" onClick={() => run(() => deleteItem(item.id))}>
        <Trash2 className="h-4 w-4 text-rose-400" />
      </IconButton>
    </div>
  );
}
