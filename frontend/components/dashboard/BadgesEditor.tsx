"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, Search, X } from "lucide-react";
import { fetchPickerEntities, updateView } from "@/lib/admin";
import { Modal } from "@/components/ui/Modal";

/** Pick which entities appear as badge chips at the top of a view. */
export function BadgesEditor({
  viewId,
  viewName,
  badges,
  run,
  onClose,
}: {
  viewId: number;
  viewName: string;
  badges: string[];
  run: (fn: () => Promise<unknown>) => Promise<void>;
  onClose: () => void;
}) {
  const { data: all } = useQuery({ queryKey: ["admin", "entities"], queryFn: fetchPickerEntities });
  const [selected, setSelected] = useState<string[]>(badges);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim();
    return (all || [])
      .filter((e) => !t || e.entity_id.toLowerCase().includes(t) || e.name.toLowerCase().includes(t))
      .slice(0, 150);
  }, [all, q]);

  const toggle = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const save = async () => {
    setBusy(true);
    await run(() => updateView(viewId, { badges: selected }));
    setBusy(false);
    onClose();
  };

  const names = new Map((all || []).map((e) => [e.entity_id, e.name]));

  return (
    <Modal
      title={`Badges — ${viewName}`}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sidra-blue to-sidra-sky py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save badges
        </button>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-muted">
          Badges are small live chips shown above this view — handy for temperature, people or
          alarm state.
        </p>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((id) => (
              <span
                key={id}
                className="flex items-center gap-1 rounded-full bg-sidra-sky/15 px-2.5 py-1 text-xs text-fg"
              >
                {names.get(id) || id}
                <button type="button" onClick={() => toggle(id)} className="text-muted hover:text-fg">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl border border-line/10 bg-fg/5 px-3">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search entities…"
            className="w-full bg-transparent py-2.5 text-sm text-fg outline-none"
          />
        </div>

        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {filtered.map((e) => {
            const on = selected.includes(e.entity_id);
            return (
              <li key={e.entity_id}>
                <button
                  type="button"
                  onClick={() => toggle(e.entity_id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                    on ? "border-sidra-sky/50 bg-sidra-sky/10" : "border-line/10 bg-fg/[0.03] hover:bg-fg/[0.06]"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-fg">{e.name}</span>
                    <span className="block truncate text-xs text-muted">{e.entity_id}</span>
                  </span>
                  {on && <Check className="h-4 w-4 text-sidra-sky" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}
