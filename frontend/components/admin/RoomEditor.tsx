"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { deleteSection, reorderItems, updateSection } from "@/lib/admin";
import { roomIcon } from "@/lib/roomIcon";
import type { AdminItem, AdminSection } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { ItemRow } from "./ItemRow";
import { CardPicker } from "./CardPicker";

function SortableItemRow({
  item,
  sections,
  run,
}: {
  item: AdminItem;
  sections: AdminSection[];
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(item.id),
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <ItemRow item={item} sections={sections} run={run} dragHandle={{ ...attributes, ...listeners }} />
    </div>
  );
}

export function RoomEditor({
  section,
  allSections,
  dragHandle,
  run,
}: {
  section: AdminSection;
  allSections: AdminSection[];
  dragHandle?: Record<string, unknown>;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const Icon = roomIcon(section.name);
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(true);
  const [name, setName] = useState(section.name);
  const [picker, setPicker] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onItemDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = section.items.map((i) => i.id);
    const oldI = ids.indexOf(Number(active.id));
    const newI = ids.indexOf(Number(over.id));
    if (oldI < 0 || newI < 0) return;
    const newIds = arrayMove(ids, oldI, newI);
    qc.setQueryData(["admin", "layout"], (old: any) =>
      old
        ? {
            ...old,
            sections: old.sections.map((s: any) =>
              s.id === section.id ? { ...s, items: arrayMove(s.items, oldI, newI) } : s
            ),
          }
        : old
    );
    run(() => reorderItems(section.id, newIds));
  };

  const existing = new Set(section.items.map((i) => i.entity_id).filter(Boolean) as string[]);

  return (
    <Card className={`p-4 ${section.hidden ? "opacity-60" : ""}`}>
      <div className="mb-3 flex items-center gap-2">
        <button
          {...(dragHandle || {})}
          type="button"
          title="Drag to reorder room"
          className="cursor-grab touch-none rounded p-1 text-muted hover:text-fg"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fg/5">
          <Icon className="h-4 w-4 text-sidra-sky" />
        </span>

        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-lg border border-line/10 bg-fg/5 px-2 py-1 text-fg outline-none"
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
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex flex-1 items-center gap-1 truncate text-left"
            >
              {open ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
              )}
              <span className="truncate font-semibold text-fg">{section.name}</span>
            </button>
            <span className="mr-1 text-xs text-muted">{section.items.length}</span>
            <IconButton
              title={section.hidden ? "Show room on dashboard" : "Hide room from dashboard"}
              onClick={() => run(() => updateSection(section.id, { hidden: !section.hidden }))}
            >
              {section.hidden ? (
                <EyeOff className="h-4 w-4 text-rose-400" />
              ) : (
                <Eye className="h-4 w-4 text-emerald-400" />
              )}
            </IconButton>
            <IconButton title="Rename room" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
            </IconButton>
            <IconButton
              title="Delete room"
              onClick={() => {
                if (
                  window.confirm(`Delete “${section.name}” and its ${section.items.length} tiles?`)
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

      {open && (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onItemDragEnd}>
            <SortableContext
              items={section.items.map((i) => String(i.id))}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                {section.items.map((it) => (
                  <SortableItemRow key={it.id} item={it} sections={allSections} run={run} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {section.items.length === 0 && (
            <p className="px-1 py-2 text-sm text-muted">No tiles yet.</p>
          )}

          <button
            type="button"
            onClick={() => setPicker(true)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line/15 py-2 text-sm text-muted transition hover:bg-fg/[0.04]"
          >
            <Plus className="h-4 w-4" /> Add card
          </button>
        </>
      )}

      {picker && (
        <CardPicker
          sectionId={section.id}
          sectionName={section.name}
          existing={existing}
          run={run}
          onClose={() => setPicker(false)}
        />
      )}
    </Card>
  );
}
