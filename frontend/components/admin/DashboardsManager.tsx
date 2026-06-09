"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import {
  type DashboardMeta,
  createDashboard,
  deleteDashboard,
  updateDashboard,
} from "@/lib/admin";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";

export function DashboardsManager({
  dashboards,
  selectedId,
  onSelect,
  run,
}: {
  dashboards: DashboardMeta[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const add = async () => {
    const n = newName.trim();
    if (!n) return;
    await run(() => createDashboard(n));
    setNewName("");
  };

  return (
    <Card className="space-y-3 p-5">
      <h2 className="font-semibold text-fg">Dashboards</h2>

      <div className="space-y-1.5">
        {dashboards.map((d) => {
          const active = d.id === selectedId;
          return (
            <div
              key={d.id}
              className={`flex items-center gap-1 rounded-xl border px-3 py-2 ${
                active ? "border-sidra-sky/40 bg-sidra-sky/10" : "border-line/10 bg-fg/[0.03]"
              } ${d.hidden ? "opacity-50" : ""}`}
            >
              {editId === d.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded-lg border border-line/10 bg-fg/5 px-2 py-1 text-sm text-fg outline-none"
                  />
                  <IconButton
                    className="text-emerald-400"
                    onClick={() => {
                      if (editName.trim()) run(() => updateDashboard(d.id, { name: editName.trim() }));
                      setEditId(null);
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </IconButton>
                  <IconButton onClick={() => setEditId(null)}>
                    <X className="h-4 w-4" />
                  </IconButton>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onSelect(d.id)}
                    className="flex flex-1 items-center gap-2 truncate text-left text-sm font-medium text-fg"
                  >
                    {d.is_default && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                    {d.name}
                    <span className="text-[11px] text-muted">/{d.slug}</span>
                  </button>
                  {!d.is_default && (
                    <IconButton
                      title="Set as default (Home)"
                      onClick={() => run(() => updateDashboard(d.id, { is_default: true }))}
                    >
                      <Star className="h-4 w-4" />
                    </IconButton>
                  )}
                  <IconButton
                    title={d.hidden ? "Show in nav" : "Hide from nav"}
                    onClick={() => run(() => updateDashboard(d.id, { hidden: !d.hidden }))}
                  >
                    {d.hidden ? (
                      <EyeOff className="h-4 w-4 text-rose-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-emerald-400" />
                    )}
                  </IconButton>
                  <IconButton
                    title="Rename"
                    onClick={() => {
                      setEditId(d.id);
                      setEditName(d.name);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  {!d.is_default && (
                    <IconButton
                      title="Delete dashboard"
                      onClick={() => {
                        if (window.confirm(`Delete dashboard “${d.name}” and all its rooms?`)) {
                          run(() => deleteDashboard(d.id));
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-rose-400" />
                    </IconButton>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New dashboard name…"
          className="flex-1 rounded-xl border border-line/10 bg-fg/5 px-3 py-2 text-sm text-fg outline-none"
        />
        <button
          type="button"
          onClick={add}
          disabled={!newName.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-sidra-blue to-sidra-sky px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
    </Card>
  );
}
