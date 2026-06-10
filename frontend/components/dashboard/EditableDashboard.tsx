"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BadgeCheck, Check, Copy, GripVertical, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createSection,
  createView,
  deleteItem,
  deleteSection,
  deleteView,
  duplicateItem,
  fetchLayout,
  reorderItems,
  updateSection,
  updateView,
} from "@/lib/admin";
import { cardSpan } from "@/lib/cardTypes";
import { roomIcon } from "@/lib/roomIcon";
import type { AdminItem, AdminSection, ViewMeta } from "@/lib/types";
import { DashCard } from "@/components/cards/DashCard";
import { BadgesEditor } from "@/components/dashboard/BadgesEditor";
import { CardPicker } from "@/components/admin/CardPicker";
import { CardEditor } from "@/components/admin/CardEditor";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";

type Run = (fn: () => Promise<unknown>) => Promise<void>;

function SortableCard({ item, run }: { item: AdminItem; run: Run }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(item.id),
  });
  const [editing, setEditing] = useState(false);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 40 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} className={`relative ${cardSpan(item.type, item.config)}`}>
      <div className="pointer-events-none">
        <DashCard item={item} />
      </div>
      <div className="absolute inset-0 rounded-3xl ring-2 ring-sidra-sky/30" />
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <button
          {...attributes}
          {...listeners}
          type="button"
          title="Drag"
          className="cursor-grab touch-none rounded-lg bg-panel/90 p-1.5 text-muted shadow backdrop-blur"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Edit card"
          onClick={() => setEditing(true)}
          className="rounded-lg bg-panel/90 p-1.5 text-muted shadow backdrop-blur hover:text-fg"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Duplicate card"
          onClick={() => run(() => duplicateItem(item.id))}
          className="rounded-lg bg-panel/90 p-1.5 text-muted shadow backdrop-blur hover:text-fg"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Remove card"
          onClick={() => {
            if (window.confirm("Remove this card?")) run(() => deleteItem(item.id));
          }}
          className="rounded-lg bg-panel/90 p-1.5 text-rose-400 shadow backdrop-blur"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {editing && <CardEditor item={item} run={run} onClose={() => setEditing(false)} />}
    </div>
  );
}

function EditableRoom({
  section,
  dashboardId,
  run,
}: {
  section: AdminSection;
  dashboardId: number;
  run: Run;
}) {
  const qc = useQueryClient();
  const Icon = roomIcon(section.name);
  const [picker, setPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(section.name);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = section.items.map((i) => i.id);
    const oi = ids.indexOf(Number(active.id));
    const ni = ids.indexOf(Number(over.id));
    if (oi < 0 || ni < 0) return;
    const newIds = arrayMove(ids, oi, ni);
    qc.setQueryData(["admin", "layout", dashboardId], (old: any) =>
      old
        ? {
            ...old,
            sections: old.sections.map((s: any) =>
              s.id === section.id ? { ...s, items: arrayMove(s.items, oi, ni) } : s
            ),
          }
        : old
    );
    run(() => reorderItems(section.id, newIds));
  };

  const existing = new Set(section.items.map((i) => i.entity_id).filter(Boolean) as string[]);

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-fg/5">
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
            <IconButton onClick={() => { setName(section.name); setEditing(false); }}>
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        ) : (
          <>
            <h2 className="flex-1 truncate text-lg font-semibold text-fg">{section.name}</h2>
            <IconButton title="Rename room" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
            </IconButton>
            <IconButton
              title="Delete room"
              onClick={() => {
                if (window.confirm(`Delete “${section.name}” and its ${section.items.length} cards?`))
                  run(() => deleteSection(section.id));
              }}
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
            </IconButton>
          </>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={section.items.map((i) => String(i.id))} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {section.items.map((it) => (
              <SortableCard key={it.id} item={it} run={run} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={() => setPicker(true)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line/15 py-2 text-sm text-muted transition hover:bg-fg/[0.04]"
      >
        <Plus className="h-4 w-4" /> Add card
      </button>

      {picker && (
        <CardPicker
          sectionId={section.id}
          sectionName={section.name}
          existing={existing}
          run={run}
          onClose={() => setPicker(false)}
        />
      )}
    </section>
  );
}

function ViewTabs({
  views,
  activeId,
  onSelect,
  onAdd,
  run,
  afterMutate,
}: {
  views: ViewMeta[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onAdd: () => void;
  run: Run;
  afterMutate: () => void;
}) {
  const [badgeEdit, setBadgeEdit] = useState<ViewMeta | null>(null);
  if (views.length === 0) return null;
  const rename = async (v: ViewMeta) => {
    const n = window.prompt("Rename view", v.name);
    if (n?.trim()) {
      await run(() => updateView(v.id, { name: n.trim() }));
      afterMutate();
    }
  };
  const del = async (v: ViewMeta) => {
    if (views.length <= 1) return;
    if (window.confirm(`Delete view “${v.name}” and its rooms?`)) {
      await run(() => deleteView(v.id));
      onSelect(views.find((x) => x.id !== v.id)!.id);
      afterMutate();
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line/10 pb-2">
      {views.map((v) => {
        const active = v.id === activeId;
        return (
          <div
            key={v.id}
            className={`flex items-center gap-1 rounded-full px-1 ${active ? "bg-sidra-sky/15" : ""}`}
          >
            <button
              type="button"
              onClick={() => onSelect(v.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                active ? "text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {v.name}
            </button>
            {active && (
              <>
                <button type="button" onClick={() => rename(v)} title="Rename view" className="rounded p-1 text-muted hover:text-fg">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setBadgeEdit(v)} title="Edit badges" className="rounded p-1 text-muted hover:text-fg">
                  <BadgeCheck className="h-3.5 w-3.5" />
                </button>
                {views.length > 1 && (
                  <button type="button" onClick={() => del(v)} title="Delete view" className="rounded p-1 text-rose-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-1 rounded-full border border-dashed border-line/20 px-3 py-1.5 text-sm text-muted hover:bg-fg/5"
      >
        <Plus className="h-3.5 w-3.5" /> View
      </button>
      {badgeEdit && (
        <BadgesEditor
          viewId={badgeEdit.id}
          viewName={badgeEdit.name}
          badges={badgeEdit.badges || []}
          run={run}
          onClose={() => {
            setBadgeEdit(null);
            afterMutate();
          }}
        />
      )}
    </div>
  );
}

export function EditableDashboard({ dashboardId }: { dashboardId: number }) {
  const qc = useQueryClient();
  const [viewId, setViewId] = useState<number | null>(null);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "layout", dashboardId, viewId],
    queryFn: () => fetchLayout(dashboardId, viewId ?? undefined),
  });
  const [error, setError] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState("");

  const run: Run = async (fn) => {
    setError(null);
    try {
      await fn();
      await refetch();
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  const activeViewId = viewId ?? data?.view_id ?? null;

  const addRoom = async () => {
    const n = newRoom.trim();
    if (!n) return;
    await run(() => createSection(n, undefined, activeViewId ?? undefined));
    setNewRoom("");
  };

  const addView = async () => {
    const name = window.prompt("New view name");
    if (!name?.trim()) return;
    const v = await createView(dashboardId, name.trim()).catch(() => null);
    await refetch();
    if (v) setViewId(v.id);
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-sidra-sky" />
      </div>
    );
  }

  const sections = data?.sections || [];
  const views = data?.views || [];

  return (
    <div className="space-y-8">
      <ViewTabs
        views={views}
        activeId={activeViewId}
        onSelect={setViewId}
        onAdd={addView}
        run={run}
        afterMutate={refetch}
      />
      {error && (
        <p className="rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">{error}</p>
      )}
      {sections.map((s) => (
        <EditableRoom key={s.id} section={s} dashboardId={dashboardId} run={run} />
      ))}
      <Card className="flex items-center gap-2 p-3">
        <input
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addRoom()}
          placeholder="New room name…"
          className="flex-1 rounded-xl border border-line/10 bg-fg/5 px-3 py-2 text-sm text-fg outline-none"
        />
        <button
          type="button"
          onClick={addRoom}
          disabled={!newRoom.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-sidra-blue to-sidra-sky px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add room
        </button>
      </Card>
    </div>
  );
}
