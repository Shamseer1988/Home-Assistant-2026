"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Search, X, Zap } from "lucide-react";
import { fetchPickerEntities, setSetting } from "@/lib/admin";
import { ACTION_DOMAINS, normalizeQuickActions, type QuickAction } from "@/lib/quickActions";
import { useSettings } from "@/lib/useSettings";
import { Card } from "@/components/ui/Card";

export function QuickActionsPanel() {
  const qc = useQueryClient();
  const { data: settings } = useSettings();
  const { data: all } = useQuery({ queryKey: ["admin", "entities"], queryFn: fetchPickerEntities });
  const actions = normalizeQuickActions(settings?.quick_actions);

  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);

  const save = async (next: QuickAction[]) => {
    await setSetting("quick_actions", next);
    qc.invalidateQueries({ queryKey: ["settings"] });
  };
  const add = (entityId: string) => {
    if (!actions.some((a) => a.entity_id === entityId)) save([...actions, { entity_id: entityId }]);
    setQ("");
    setAdding(false);
  };
  const remove = (i: number) => save(actions.filter((_, j) => j !== i));
  const move = (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= actions.length) return;
    const n = [...actions];
    [n[i], n[j]] = [n[j], n[i]];
    save(n);
  };
  const setLabel = (i: number, label: string) =>
    save(actions.map((a, j) => (j === i ? { ...a, label: label || undefined } : a)));

  const nameOf = (id: string) => all?.find((e) => e.entity_id === id)?.name || id;

  const suggestions = useMemo(() => {
    const term = q.toLowerCase().trim();
    const have = new Set(actions.map((a) => a.entity_id));
    return (all || [])
      .filter((e) => !have.has(e.entity_id))
      .filter((e) => ACTION_DOMAINS.includes(e.domain) || term)
      .filter(
        (e) =>
          !term || e.entity_id.toLowerCase().includes(term) || e.name.toLowerCase().includes(term)
      )
      .slice(0, 40);
  }, [all, q, actions]);

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-sidra-sky" />
        <h2 className="font-semibold text-fg">Quick actions</h2>
      </div>
      <p className="text-sm text-muted">
        One-tap chips on the home screen for your scenes, scripts and automations.
      </p>

      <div className="space-y-2">
        {actions.map((a, i) => (
          <div
            key={a.entity_id}
            className="flex items-center gap-1.5 rounded-xl border border-line/10 bg-fg/[0.03] px-2.5 py-1.5"
          >
            <span className="min-w-0 flex-1">
              <input
                defaultValue={a.label || ""}
                placeholder={nameOf(a.entity_id)}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (a.label || "")) setLabel(i, v);
                }}
                className="w-full bg-transparent text-sm text-fg outline-none"
              />
              <span className="block truncate text-[11px] text-muted">{a.entity_id}</span>
            </span>
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              title="Move up"
              className="rounded p-1 text-muted hover:bg-fg/10 disabled:opacity-30"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === actions.length - 1}
              title="Move down"
              className="rounded p-1 text-muted hover:bg-fg/10 disabled:opacity-30"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => remove(i)}
              title="Remove"
              className="rounded p-1 text-rose-400 hover:bg-fg/10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {actions.length === 0 && <p className="text-xs text-muted">No quick actions yet.</p>}
      </div>

      {adding ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-xl border border-line/10 bg-fg/5 px-3">
            <Search className="h-4 w-4 text-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search scenes, scripts, automations…"
              className="w-full bg-transparent py-2 text-sm text-fg outline-none"
            />
          </div>
          <ul className="max-h-56 space-y-1 overflow-y-auto">
            {suggestions.map((e) => (
              <li key={e.entity_id}>
                <button
                  type="button"
                  onClick={() => add(e.entity_id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-line/10 bg-fg/[0.03] px-3 py-2 text-left text-sm transition hover:bg-fg/[0.06]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-fg">{e.name}</span>
                    <span className="block truncate text-xs text-muted">{e.entity_id}</span>
                  </span>
                  <Plus className="h-4 w-4 text-sidra-sky" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setQ("");
            }}
            className="text-xs text-muted hover:text-fg"
          >
            Done
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-xl border border-dashed border-line/15 px-3 py-1.5 text-sm text-muted transition hover:bg-fg/5"
        >
          <Plus className="h-4 w-4" /> Add action
        </button>
      )}
    </Card>
  );
}
