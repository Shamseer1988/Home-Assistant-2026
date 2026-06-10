"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, GripVertical, Pencil, SlidersHorizontal, Trash2, X } from "lucide-react";
import { deleteItem, updateItem } from "@/lib/admin";
import { CARD_LABEL } from "@/lib/cardTypes";
import type { AdminItem, AdminSection } from "@/lib/types";
import { CardEditor } from "@/components/admin/CardEditor";
import { IconButton } from "@/components/ui/IconButton";

export function ItemRow({
  item,
  sections,
  run,
  dragHandle,
}: {
  item: AdminItem;
  sections: AdminSection[];
  run: (fn: () => Promise<unknown>) => Promise<void>;
  dragHandle?: Record<string, unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [cardEdit, setCardEdit] = useState(false);
  const [label, setLabel] = useState(item.label || "");
  const cardLabel = CARD_LABEL[item.type] || item.type;
  const display =
    item.label || item.live_name || item.entity_id || `${cardLabel} card`;
  const sub = item.entity_id || (item.type !== "entity" ? `${cardLabel} card` : "");

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
    <div
      className={`flex items-center gap-1 rounded-xl border border-line/10 bg-fg/[0.03] px-2 py-1.5 ${
        item.hidden ? "opacity-50" : ""
      }`}
    >
      <button
        {...(dragHandle || {})}
        type="button"
        title="Drag to reorder"
        className="cursor-grab touch-none rounded p-1 text-muted hover:text-fg"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-fg">{display}</p>
        <p className="truncate text-[11px] text-muted">{sub}</p>
      </div>
      <IconButton
        title={item.hidden ? "Show on dashboard" : "Hide from dashboard"}
        onClick={() => run(() => updateItem(item.id, { hidden: !item.hidden }))}
      >
        {item.hidden ? (
          <EyeOff className="h-4 w-4 text-rose-400" />
        ) : (
          <Eye className="h-4 w-4 text-emerald-400" />
        )}
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
      <IconButton title="Configure card" onClick={() => setCardEdit(true)}>
        <SlidersHorizontal className="h-4 w-4" />
      </IconButton>
      <IconButton title="Remove" onClick={() => run(() => deleteItem(item.id))}>
        <Trash2 className="h-4 w-4 text-rose-400" />
      </IconButton>
      {cardEdit && <CardEditor item={item} run={run} onClose={() => setCardEdit(false)} />}
    </div>
  );
}
