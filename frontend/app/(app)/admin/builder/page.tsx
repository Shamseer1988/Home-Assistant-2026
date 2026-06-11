"use client";

import { useState } from "react";
import Link from "next/link";
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, BadgeCheck, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createSection,
  createView,
  deleteView,
  fetchAdminDashboards,
  fetchLayout,
  reorderSections,
  updateView,
} from "@/lib/admin";
import type { AdminSection, ViewMeta } from "@/lib/types";
import { BadgesEditor } from "@/components/dashboard/BadgesEditor";
import { AppearancePanel } from "@/components/admin/AppearancePanel";
import { DashboardsManager } from "@/components/admin/DashboardsManager";
import { RoomEditor } from "@/components/admin/RoomEditor";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { VisibilityPanel } from "@/components/admin/VisibilityPanel";
import { WidgetsPanel } from "@/components/admin/WidgetsPanel";
import { Card } from "@/components/ui/Card";

function SortableRoom({
  section,
  allSections,
  run,
}: {
  section: AdminSection;
  allSections: AdminSection[];
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(section.id),
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <RoomEditor
        section={section}
        allSections={allSections}
        run={run}
        dragHandle={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export default function BuilderPage() {
  const qc = useQueryClient();
  const { data: dashboards } = useQuery({
    queryKey: ["admin", "dashboards"],
    queryFn: fetchAdminDashboards,
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);
  const effectiveId = selectedId ?? dashboards?.find((d) => d.is_default)?.id ?? null;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "layout", effectiveId, viewId],
    queryFn: () => fetchLayout(effectiveId ?? undefined, viewId ?? undefined),
    enabled: dashboards != null,
  });
  const [error, setError] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState("");
  const [adding, setAdding] = useState(false);
  const [badgeEdit, setBadgeEdit] = useState<ViewMeta | null>(null);

  const views = data?.views || [];
  const activeViewId = viewId && views.some((v) => v.id === viewId) ? viewId : data?.view_id ?? null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const reload = async () => {
    await refetch();
    qc.invalidateQueries({ queryKey: ["admin", "dashboards"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["dashboards"] });
  };

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  const sections = data?.sections || [];

  const onSectionDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = sections.map((s) => s.id);
    const oldI = ids.indexOf(Number(active.id));
    const newI = ids.indexOf(Number(over.id));
    if (oldI < 0 || newI < 0) return;
    const newIds = arrayMove(ids, oldI, newI);
    qc.setQueryData(["admin", "layout", effectiveId, viewId], (old: any) =>
      old ? { ...old, sections: arrayMove(old.sections, oldI, newI) } : old
    );
    run(() => reorderSections(newIds));
  };

  const addRoom = async () => {
    const name = newRoom.trim();
    if (!name) return;
    setAdding(true);
    await run(() => createSection(name, undefined, activeViewId ?? undefined));
    setNewRoom("");
    setAdding(false);
  };

  const addView = async () => {
    if (!effectiveId) return;
    const name = window.prompt("New view name");
    if (!name?.trim()) return;
    const v = await createView(effectiveId, name.trim()).catch(() => null);
    await reload();
    if (v) setViewId(v.id);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Link
          href="/admin"
          className="rounded-xl border border-line/10 bg-fg/[0.04] p-2 text-muted transition hover:bg-fg/[0.08]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-sm text-muted">Admin</p>
          <h1 className="text-2xl font-bold text-fg">Dashboard Builder</h1>
        </div>
      </header>

      <DashboardsManager
        dashboards={dashboards || []}
        selectedId={effectiveId}
        onSelect={setSelectedId}
        run={run}
      />

      <p className="text-sm font-semibold text-fg">
        Editing: {dashboards?.find((d) => d.id === effectiveId)?.name || "Home"}
      </p>

      {views.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line/10 pb-2">
          {views.map((v) => {
            const active = v.id === activeViewId;
            return (
              <div
                key={v.id}
                className={`flex items-center gap-1 rounded-full px-1 ${active ? "bg-sidra-sky/15" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => setViewId(v.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    active ? "text-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  {v.name}
                </button>
                {active && (
                  <>
                    <button
                      type="button"
                      title="Rename view"
                      onClick={() => {
                        const n = window.prompt("Rename view", v.name);
                        if (n?.trim()) run(() => updateView(v.id, { name: n.trim() }));
                      }}
                      className="rounded p-1 text-muted hover:text-fg"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Edit badges"
                      onClick={() => setBadgeEdit(v)}
                      className="rounded p-1 text-muted hover:text-fg"
                    >
                      <BadgeCheck className="h-3.5 w-3.5" />
                    </button>
                    {views.length > 1 && (
                      <button
                        type="button"
                        title="Delete view"
                        onClick={() => {
                          if (window.confirm(`Delete view “${v.name}” and its rooms?`)) {
                            setViewId(null);
                            run(() => deleteView(v.id));
                          }
                        }}
                        className="rounded p-1 text-rose-400"
                      >
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
            onClick={addView}
            className="flex items-center gap-1 rounded-full border border-dashed border-line/20 px-3 py-1.5 text-sm text-muted hover:bg-fg/5"
          >
            <Plus className="h-3.5 w-3.5" /> View
          </button>
        </div>
      )}

      {badgeEdit && (
        <BadgesEditor
          viewId={badgeEdit.id}
          viewName={badgeEdit.name}
          badges={badgeEdit.badges || []}
          run={run}
          onClose={() => setBadgeEdit(null)}
        />
      )}

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
          disabled={!newRoom.trim() || adding}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-sidra-blue to-sidra-sky px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add room
        </button>
      </Card>

      {error && (
        <p className="rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">{error}</p>
      )}

      <p className="text-xs text-muted">Drag the ⠿ handle to reorder rooms and tiles.</p>

      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-sidra-sky" />
        </div>
      ) : sections.length === 0 ? (
        <Card className="p-10 text-center text-muted">
          No rooms yet. Add one above, or run “Sync rooms from Home Assistant” on the admin home.
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSectionDragEnd}>
          <SortableContext
            items={sections.map((s) => String(s.id))}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {sections.map((s) => (
                <SortableRoom key={s.id} section={s} allSections={sections} run={run} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <UsersPanel />
      <AppearancePanel />
      <WidgetsPanel />
      <VisibilityPanel />
    </div>
  );
}
