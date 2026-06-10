"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, Search } from "lucide-react";
import { fetchPickerEntities, updateItem } from "@/lib/admin";
import { CARD_COLORS, CARD_TYPES, WIDTH_OPTIONS } from "@/lib/cardTypes";
import { Modal } from "@/components/ui/Modal";

export interface EditableCard {
  id: number;
  type: string;
  entity_id: string | null;
  label: string | null;
  config?: Record<string, any> | null;
}

export function CardEditor({
  item,
  run,
  onClose,
}: {
  item: EditableCard;
  run: (fn: () => Promise<unknown>) => Promise<void>;
  onClose: () => void;
}) {
  const def = CARD_TYPES.find((c) => c.key === item.type) || CARD_TYPES[0];
  const cfg = item.config || {};
  const { data: all } = useQuery({ queryKey: ["admin", "entities"], queryFn: fetchPickerEntities });
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [entityId, setEntityId] = useState(item.entity_id || "");
  const [entityIds, setEntityIds] = useState<string[]>(cfg.entities || cfg.entity_ids || []);
  const [label, setLabel] = useState(item.label || cfg.title || "");
  const [content, setContent] = useState(cfg.content || "");
  const [url, setUrl] = useState(cfg.url || "");
  const [service, setService] = useState(cfg.service || "");
  const [cols, setCols] = useState<string>(cfg.cols != null ? String(cfg.cols) : "auto");
  const [color, setColor] = useState<string>(cfg.color || "");

  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim();
    return (all || [])
      .filter((e) => !t || e.entity_id.toLowerCase().includes(t) || e.name.toLowerCase().includes(t))
      .slice(0, 150);
  }, [all, q]);

  const save = async () => {
    const config: any = { ...cfg };
    delete config.entity_ids;
    if (cols === "auto") delete config.cols;
    else config.cols = cols;
    if (color) config.color = color;
    else delete config.color;

    const patch: any = { config };
    if (def.needs === "entity") {
      patch.entity_id = entityId || null;
      patch.label = label || null;
      if (def.key === "button") {
        if (service) config.service = service;
        else delete config.service;
      }
    } else if (def.needs === "entities") {
      config.entities = entityIds;
      config.title = label || undefined;
    } else if (def.needs === "text") {
      config.content = content;
      config.title = label || undefined;
    } else if (def.needs === "url") {
      config.url = url;
      config.title = label || undefined;
    } else {
      patch.label = label || null;
    }
    setBusy(true);
    await run(() => updateItem(item.id, patch));
    setBusy(false);
    onClose();
  };

  const searchBox = (
    <div className="mb-3 flex items-center gap-2 rounded-xl border border-line/10 bg-fg/5 px-3">
      <Search className="h-4 w-4 text-muted" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search entities…"
        className="w-full bg-transparent py-2.5 text-sm text-fg outline-none"
      />
    </div>
  );

  return (
    <Modal
      title={`Edit ${def.name} card`}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sidra-blue to-sidra-sky py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
        </button>
      }
    >
      <div className="space-y-3">
        {def.needs !== "text" && def.needs !== "url" && (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Title (optional)"
            className="w-full rounded-xl border border-line/10 bg-fg/5 px-3 py-2 text-sm text-fg outline-none"
          />
        )}

        {(def.needs === "entity" || def.needs === "entities") && (
          <>
            {searchBox}
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {filtered.map((e) => {
                const on =
                  def.needs === "entity" ? entityId === e.entity_id : entityIds.includes(e.entity_id);
                return (
                  <li key={e.entity_id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (def.needs === "entity") setEntityId(e.entity_id);
                        else
                          setEntityIds((p) =>
                            p.includes(e.entity_id) ? p.filter((x) => x !== e.entity_id) : [...p, e.entity_id]
                          );
                      }}
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
          </>
        )}

        {def.key === "button" && (
          <input
            value={service}
            onChange={(e) => setService(e.target.value)}
            placeholder="Service (optional, e.g. script.turn_on)"
            className="w-full rounded-xl border border-line/10 bg-fg/5 px-3 py-2 text-sm text-fg outline-none"
          />
        )}

        {def.needs === "text" && (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Markdown…"
            className="w-full rounded-xl border border-line/10 bg-fg/5 px-3 py-2 text-sm text-fg outline-none"
          />
        )}
        {def.needs === "url" && (
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-xl border border-line/10 bg-fg/5 px-3 py-2 text-sm text-fg outline-none"
          />
        )}

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">Width</p>
          <div className="flex flex-wrap gap-1.5">
            {WIDTH_OPTIONS.map((w) => (
              <button
                key={w.value}
                type="button"
                onClick={() => setCols(w.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  cols === w.value
                    ? "bg-sidra-sky text-white"
                    : "border border-line/10 bg-fg/5 text-muted hover:bg-fg/10"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">Colour</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setColor("")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                color === ""
                  ? "bg-sidra-sky text-white"
                  : "border border-line/10 bg-fg/5 text-muted hover:bg-fg/10"
              }`}
            >
              Auto
            </button>
            {CARD_COLORS.map((c) => {
              const active = color === c.hex;
              return (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => setColor(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  className={`h-7 w-7 rounded-full transition ${
                    active ? "ring-2 ring-fg ring-offset-2 ring-offset-panel" : "hover:scale-110"
                  }`}
                >
                  {active && <Check className="mx-auto h-3.5 w-3.5 text-white drop-shadow" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
