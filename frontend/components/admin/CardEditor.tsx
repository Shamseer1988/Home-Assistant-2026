"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Check, Loader2, Plus, Search, X } from "lucide-react";
import { fetchPickerEntities, updateItem } from "@/lib/admin";
import { CARD_COLORS, CARD_TYPES, CHILD_CARD_TYPES, WIDTH_OPTIONS } from "@/lib/cardTypes";
import { type ChildCard } from "@/lib/childCard";
import {
  CONDITION_OPS,
  normalizeConditions,
  opNeedsValue,
  type Condition,
} from "@/lib/conditions";
import { TAP_ACTIONS, TAP_TYPES, type TapAction } from "@/lib/tapAction";
import type { DashItem } from "@/lib/types";
import { DashCard } from "@/components/cards/DashCard";
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
  const [conditions, setConditions] = useState<Condition[]>(normalizeConditions(cfg.conditions));
  const [cards, setCards] = useState<ChildCard[]>(Array.isArray(cfg.cards) ? cfg.cards : []);
  const [columns, setColumns] = useState<number>(Number(cfg.columns) || 2);
  const [tap, setTap] = useState<TapAction>((cfg.tap_action as TapAction) || {});

  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim();
    return (all || [])
      .filter((e) => !t || e.entity_id.toLowerCase().includes(t) || e.name.toLowerCase().includes(t))
      .slice(0, 150);
  }, [all, q]);

  const addCond = () => setConditions((p) => [...p, { entity: "", op: "on" }]);
  const updateCond = (i: number, patch: Partial<Condition>) =>
    setConditions((p) => p.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const removeCond = (i: number) => setConditions((p) => p.filter((_, j) => j !== i));

  const addChild = () => setCards((p) => [...p, { type: "entity", entity_id: "" }]);
  const updateChild = (i: number, patch: Partial<ChildCard>) =>
    setCards((p) => p.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const removeChild = (i: number) => setCards((p) => p.filter((_, j) => j !== i));
  const moveChild = (i: number, dir: number) =>
    setCards((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.length) return p;
      const n = [...p];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  // The patch we'd save — also feeds the live preview, so it stays in sync.
  const patch = useMemo(() => {
    const config: any = { ...cfg };
    delete config.entity_ids;
    if (cols === "auto") delete config.cols;
    else config.cols = cols;
    if (color) config.color = color;
    else delete config.color;
    const conds = conditions.filter((c) => c.entity);
    if (conds.length) config.conditions = conds;
    else delete config.conditions;

    const p: any = { config };
    if (def.needs === "entity") {
      p.entity_id = entityId || null;
      p.label = label || null;
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
    } else if (def.needs === "cards") {
      config.cards = cards.filter((c) => c.entity_id);
      config.title = label || undefined;
      if (def.key === "grid") config.columns = columns;
      else delete config.columns;
    } else {
      p.label = label || null;
    }

    if (TAP_TYPES.includes(def.key)) {
      const a = tap.action;
      if (a && a !== "default") {
        const t: TapAction = { action: a };
        if (a === "navigate" && tap.navigation_path) t.navigation_path = tap.navigation_path;
        if (a === "url" && tap.url_path) t.url_path = tap.url_path;
        if (a === "call-service" && tap.service) t.service = tap.service;
        config.tap_action = t;
      } else {
        delete config.tap_action;
      }
    }
    return p;
  }, [cfg, cols, color, conditions, def, entityId, label, service, entityIds, content, url, cards, columns, tap]);

  const previewItem: DashItem = {
    id: item.id,
    type: item.type,
    entity_id: def.needs === "entity" ? entityId || null : null,
    label: label || null,
    icon: null,
    config: patch.config,
  };

  const save = async () => {
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
        <div className="rounded-2xl border border-line/10 bg-fg/[0.02] p-3">
          <p className="mb-2 text-xs font-medium text-muted">Preview</p>
          <div className="pointer-events-none">
            <DashCard item={previewItem} />
          </div>
        </div>

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

        {def.needs === "cards" && (
          <div>
            {def.key === "grid" && (
              <div className="mb-3">
                <p className="mb-1.5 text-xs font-medium text-muted">Columns</p>
                <div className="flex gap-1.5">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setColumns(n)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        columns === n
                          ? "bg-sidra-sky text-white"
                          : "border border-line/10 bg-fg/5 text-muted hover:bg-fg/10"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="mb-1.5 text-xs font-medium text-muted">Cards inside</p>
            {cards.length === 0 && (
              <p className="mb-2 text-xs text-muted">Empty. Add cards to group them together.</p>
            )}
            <div className="space-y-2">
              {cards.map((c, i) => (
                <div key={i} className="rounded-xl border border-line/10 bg-fg/[0.03] p-2">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={c.type || "entity"}
                      onChange={(e) => updateChild(i, { type: e.target.value })}
                      className="rounded-lg border border-line/10 bg-fg/5 px-2 py-1.5 text-xs text-fg outline-none"
                    >
                      {CHILD_CARD_TYPES.map((t) => (
                        <option key={t.key} value={t.key} className="bg-panel">
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <input
                      list="cond-entities"
                      value={c.entity_id || ""}
                      onChange={(e) => updateChild(i, { entity_id: e.target.value })}
                      placeholder="entity_id"
                      className="min-w-0 flex-1 rounded-lg border border-line/10 bg-fg/5 px-2 py-1.5 text-xs text-fg outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => moveChild(i, -1)}
                      disabled={i === 0}
                      title="Move up"
                      className="rounded p-1 text-muted hover:bg-fg/10 disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveChild(i, 1)}
                      disabled={i === cards.length - 1}
                      title="Move down"
                      className="rounded p-1 text-muted hover:bg-fg/10 disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeChild(i)}
                      title="Remove card"
                      className="rounded p-1 text-rose-400 hover:bg-fg/10"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    value={c.label || ""}
                    onChange={(e) => updateChild(i, { label: e.target.value })}
                    placeholder="Title (optional)"
                    className="mt-1.5 w-full rounded-lg border border-line/10 bg-fg/5 px-2 py-1.5 text-xs text-fg outline-none"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addChild}
              className="mt-2 flex items-center gap-1 rounded-lg border border-dashed border-line/15 px-2.5 py-1 text-xs text-muted transition hover:bg-fg/5"
            >
              <Plus className="h-3 w-3" /> Add card
            </button>
          </div>
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

        {TAP_TYPES.includes(def.key) && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">Tap action</p>
            <select
              value={tap.action || "default"}
              onChange={(e) => setTap((p) => ({ ...p, action: e.target.value }))}
              className="w-full rounded-lg border border-line/10 bg-fg/5 px-2 py-2 text-sm text-fg outline-none"
            >
              {TAP_ACTIONS.map((a) => (
                <option key={a.value} value={a.value} className="bg-panel">
                  {a.label}
                </option>
              ))}
            </select>
            {tap.action === "navigate" && (
              <input
                value={tap.navigation_path || ""}
                onChange={(e) => setTap((p) => ({ ...p, navigation_path: e.target.value }))}
                placeholder="/d/bedroom"
                className="mt-2 w-full rounded-lg border border-line/10 bg-fg/5 px-2 py-2 text-sm text-fg outline-none"
              />
            )}
            {tap.action === "url" && (
              <input
                value={tap.url_path || ""}
                onChange={(e) => setTap((p) => ({ ...p, url_path: e.target.value }))}
                placeholder="https://…"
                className="mt-2 w-full rounded-lg border border-line/10 bg-fg/5 px-2 py-2 text-sm text-fg outline-none"
              />
            )}
            {tap.action === "call-service" && (
              <input
                value={tap.service || ""}
                onChange={(e) => setTap((p) => ({ ...p, service: e.target.value }))}
                placeholder="script.movie_time"
                className="mt-2 w-full rounded-lg border border-line/10 bg-fg/5 px-2 py-2 text-sm text-fg outline-none"
              />
            )}
          </div>
        )}

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">Visibility</p>
          {conditions.length === 0 && (
            <p className="mb-2 text-xs text-muted">
              Always shown. Add a condition to show this card only when an entity is in a given
              state.
            </p>
          )}
          <div className="space-y-2">
            {conditions.map((c, i) => (
              <div key={i} className="flex flex-wrap items-center gap-1.5">
                <input
                  list="cond-entities"
                  value={c.entity}
                  onChange={(e) => updateCond(i, { entity: e.target.value })}
                  placeholder="entity_id"
                  className="min-w-0 flex-1 rounded-lg border border-line/10 bg-fg/5 px-2 py-1.5 text-xs text-fg outline-none"
                />
                <select
                  value={c.op}
                  onChange={(e) => updateCond(i, { op: e.target.value })}
                  className="rounded-lg border border-line/10 bg-fg/5 px-2 py-1.5 text-xs text-fg outline-none"
                >
                  {CONDITION_OPS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-panel">
                      {o.label}
                    </option>
                  ))}
                </select>
                {opNeedsValue(c.op) && (
                  <input
                    value={c.value || ""}
                    onChange={(e) => updateCond(i, { value: e.target.value })}
                    placeholder="value"
                    className="w-20 rounded-lg border border-line/10 bg-fg/5 px-2 py-1.5 text-xs text-fg outline-none"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeCond(i)}
                  title="Remove condition"
                  className="rounded p-1 text-rose-400 hover:bg-fg/10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addCond}
            className="mt-2 flex items-center gap-1 rounded-lg border border-dashed border-line/15 px-2.5 py-1 text-xs text-muted transition hover:bg-fg/5"
          >
            <Plus className="h-3 w-3" /> Add condition
          </button>
          <datalist id="cond-entities">
            {(all || []).map((e) => (
              <option key={e.entity_id} value={e.entity_id}>
                {e.name}
              </option>
            ))}
          </datalist>
        </div>
      </div>
    </Modal>
  );
}
