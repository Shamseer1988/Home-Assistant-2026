"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, Search } from "lucide-react";
import { fetchPickerEntities } from "@/lib/admin";
import { Modal } from "@/components/ui/Modal";

const MAX_VISIBLE = 200;

const OFFISH = ["off", "unavailable", "unknown", "closed", "idle", "standby"];
const FILTERS: { k: string; label: string }[] = [
  { k: "all", label: "All" },
  { k: "active", label: "Active" },
  { k: "unavailable", label: "Unavailable" },
  { k: "light", label: "Lights" },
  { k: "switch", label: "Switches" },
  { k: "fan", label: "Fans" },
  { k: "sensor", label: "Sensors" },
  { k: "binary_sensor", label: "Binary" },
];

function matchFilter(e: { domain: string; state: string }, f: string) {
  if (f === "all") return true;
  if (f === "active") return !OFFISH.includes(e.state);
  if (f === "unavailable") return ["unavailable", "unknown"].includes(e.state);
  return e.domain === f;
}

export function EntityPickerModal({
  existing,
  onClose,
  onAdd,
  busy,
}: {
  existing: Set<string>;
  onClose: () => void;
  onAdd: (ids: string[]) => void;
  busy: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "entities"],
    queryFn: fetchPickerEntities,
  });
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    const list = (data || []).filter(
      (e) =>
        !existing.has(e.entity_id) &&
        matchFilter(e, filter) &&
        (!term ||
          e.entity_id.toLowerCase().includes(term) ||
          e.name.toLowerCase().includes(term))
    );
    return { rows: list.slice(0, MAX_VISIBLE), total: list.length };
  }, [data, q, filter, existing]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <Modal
      title="Add entities"
      onClose={onClose}
      footer={
        <button
          type="button"
          disabled={selected.size === 0 || busy}
          onClick={() => onAdd([...selected])}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sidra-blue to-sidra-sky py-2.5 text-sm font-semibold text-fg transition hover:opacity-90 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {selected.size > 0 ? `Add ${selected.size}` : "Add"}{" "}
          {selected.size === 1 ? "entity" : "entities"}
        </button>
      }
    >
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-line/10 bg-fg/5 px-3">
        <Search className="h-4 w-4 text-muted" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search entities…"
          className="w-full bg-transparent py-2.5 text-sm text-fg outline-none"
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.k}
            type="button"
            onClick={() => setFilter(f.k)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              filter === f.k
                ? "bg-sidra-sky text-white"
                : "border border-line/10 bg-fg/5 text-muted hover:bg-fg/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-8 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-sidra-sky" />
        </div>
      ) : (
        <ul className="space-y-1">
          {filtered.rows.map((e) => {
            const on = selected.has(e.entity_id);
            return (
              <li key={e.entity_id}>
                <button
                  type="button"
                  onClick={() => toggle(e.entity_id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                    on
                      ? "border-sidra-sky/50 bg-sidra-sky/10"
                      : "border-line/10 bg-fg/[0.03] hover:bg-fg/[0.06]"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      on
                        ? "border-sidra-sky bg-sidra-sky text-fg"
                        : "border-line/20"
                    }`}
                  >
                    {on && <Check className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-fg">{e.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {e.entity_id}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {filtered.total === 0 && (
            <li className="py-6 text-center text-sm text-muted">
              No matching entities
            </li>
          )}
          {filtered.total > MAX_VISIBLE && (
            <li className="py-2 text-center text-xs text-muted">
              Showing {MAX_VISIBLE} of {filtered.total} — refine your search
            </li>
          )}
        </ul>
      )}
    </Modal>
  );
}
