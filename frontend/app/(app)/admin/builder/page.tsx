"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { createSection, fetchLayout, reorderSections } from "@/lib/admin";
import { RoomEditor } from "@/components/admin/RoomEditor";
import { VisibilityPanel } from "@/components/admin/VisibilityPanel";
import { Card } from "@/components/ui/Card";

export default function BuilderPage() {
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "layout"],
    queryFn: fetchLayout,
  });
  const [error, setError] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState("");
  const [adding, setAdding] = useState(false);

  const reload = async () => {
    await refetch();
    qc.invalidateQueries({ queryKey: ["dashboard"] });
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

  const moveRoom = (idx: number, dir: number) => {
    const ids = sections.map((s) => s.id);
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    run(() => reorderSections(ids));
  };

  const addRoom = async () => {
    const name = newRoom.trim();
    if (!name) return;
    setAdding(true);
    await run(() => createSection(name));
    setNewRoom("");
    setAdding(false);
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
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-sidra-blue to-sidra-sky px-3 py-2 text-sm font-semibold text-fg transition hover:opacity-90 disabled:opacity-50"
        >
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add room
        </button>
      </Card>

      {error && (
        <p className="rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-sidra-sky" />
        </div>
      ) : sections.length === 0 ? (
        <Card className="p-10 text-center text-muted">
          No rooms yet. Add one above, or run “Sync rooms from Home Assistant”
          on the admin home.
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((s, i) => (
            <RoomEditor
              key={s.id}
              section={s}
              allSections={sections}
              index={i}
              total={sections.length}
              onMoveRoom={(dir) => moveRoom(i, dir)}
              run={run}
            />
          ))}
        </div>
      )}

      <VisibilityPanel />
    </div>
  );
}
