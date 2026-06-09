"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, Search } from "lucide-react";
import { addItems, createCard, fetchPickerEntities } from "@/lib/admin";
import { CARD_TYPES, type CardTypeDef } from "@/lib/cardTypes";
import { Modal } from "@/components/ui/Modal";

export function CardPicker({
  sectionId,
  sectionName,
  existing,
  run,
  onClose,
}: {
  sectionId: number;
  sectionName: string;
  existing: Set<string>;
  run: (fn: () => Promise<unknown>) => Promise<void>;
  onClose: () => void;
}) {
  const { data: all } = useQuery({ queryKey: ["admin", "entities"], queryFn: fetchPickerEntities });
  const [tab, setTab] = useState<"card" | "entity">("card");
  const [chosen, setChosen] = useState<CardTypeDef | null>(null);
  const [busy, setBusy] = useState(false);

  const [entityId, setEntityId] = useState("");
  const [entityIds, setEntityIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [service, setService] = useState("");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    return (all || [])
      .filter((e) => !term || e.entity_id.toLowerCase().includes(term) || e.name.toLowerCase().includes(term))
      .slice(0, 150);
  }, [all, q]);

  const addCard = async () => {
    if (!chosen) return;
    const payload: any = { type: chosen.key };
    if (chosen.needs === "entity") {
      if (!entityId) return;
      payload.entity_id = entityId;
      if (title) payload.label = title;
      if (chosen.key === "button" && service) payload.config = { service };
    } else if (chosen.needs === "entities") {
      payload.config = { entities: entityIds, title: title || undefined };
    } else if (chosen.needs === "text") {
      payload.config = { content, title: title || undefined };
    } else if (chosen.needs === "url") {
      payload.config = { url, title: title || undefined };
    } else if (title) {
      payload.label = title;
    }
    setBusy(true);
    await run(() => createCard(sectionId, payload));
    setBusy(false);
    onClose();
  };

  const addEntities = async () => {
    setBusy(true);
    await run(() => addItems(sectionId, [...sel]));
    setBusy(false);
    onClose();
  };

  const searchBox = (
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
  );

  // ---- footer button ----
  const canAdd =
    chosen &&
    !busy &&
    !(chosen.needs === "entity" && !entityId) &&
    !(chosen.needs === "url" && !url) &&
    !(chosen.needs === "entities" && entityIds.length === 0);

  const footer = chosen ? (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setChosen(null)}
        className="rounded-xl border border-line/10 bg-fg/5 px-4 py-2.5 text-sm text-muted hover:bg-fg/10"
      >
        Back
      </button>
      <button
        type="button"
        onClick={addCard}
        disabled={!canAdd}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sidra-blue to-sidra-sky py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Add card
      </button>
    </div>
  ) : tab === "entity" ? (
    <button
      type="button"
      onClick={addEntities}
      disabled={busy || sel.size === 0}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sidra-blue to-sidra-sky py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      Add {sel.size > 0 ? sel.size : ""} {sel.size === 1 ? "entity" : "entities"}
    </button>
  ) : undefined;

  return (
    <Modal
      title={chosen ? `Add ${chosen.name} card` : `Add card to "${sectionName}"`}
      onClose={onClose}
      footer={footer}
    >
      {!chosen && (
        <div className="mb-4 flex gap-4 border-b border-line/10">
          {(["card", "entity"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 pb-2 text-sm font-medium transition ${
                tab === t ? "border-sidra-sky text-fg" : "border-transparent text-muted"
              }`}
            >
              {t === "card" ? "By card" : "By entity"}
            </button>
          ))}
        </div>
      )}

      {/* Gallery */}
      {!chosen && tab === "card" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CARD_TYPES.map((ct) => {
            const Icon = ct.icon;
            return (
              <button
                key={ct.key}
                type="button"
                onClick={() => {
                  setChosen(ct);
                  setQ("");
                }}
                className="flex flex-col items-start gap-2 rounded-2xl border border-line/10 bg-fg/[0.03] p-4 text-left transition hover:bg-fg/[0.06]"
              >
                <Icon className="h-5 w-5 text-sidra-sky" />
                <span className="text-sm font-semibold text-fg">{ct.name}</span>
                <span className="text-xs text-muted">{ct.description}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* By entity (quick add as entity cards) */}
      {!chosen && tab === "entity" && (
        <>
          {searchBox}
          <ul className="space-y-1">
            {filtered
              .filter((e) => !existing.has(e.entity_id))
              .map((e) => {
                const on = sel.has(e.entity_id);
                return (
                  <li key={e.entity_id}>
                    <button
                      type="button"
                      onClick={() =>
                        setSel((p) => {
                          const n = new Set(p);
                          n.has(e.entity_id) ? n.delete(e.entity_id) : n.add(e.entity_id);
                          return n;
                        })
                      }
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                        on ? "border-sidra-sky/50 bg-sidra-sky/10" : "border-line/10 bg-fg/[0.03] hover:bg-fg/[0.06]"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                          on ? "border-sidra-sky bg-sidra-sky text-white" : "border-line/20"
                        }`}
                      >
                        {on && <Check className="h-3 w-3" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-fg">{e.name}</span>
                        <span className="block truncate text-xs text-muted">{e.entity_id}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </>
      )}

      {/* Config form */}
      {chosen && (
        <div className="space-y-3">
          {chosen.needs !== "text" && chosen.needs !== "url" && (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full rounded-xl border border-line/10 bg-fg/5 px-3 py-2 text-sm text-fg outline-none"
            />
          )}

          {(chosen.needs === "entity" || chosen.needs === "entities") && (
            <>
              {searchBox}
              <ul className="max-h-72 space-y-1 overflow-y-auto">
                {filtered.map((e) => {
                  const on =
                    chosen.needs === "entity" ? entityId === e.entity_id : entityIds.includes(e.entity_id);
                  return (
                    <li key={e.entity_id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (chosen.needs === "entity") setEntityId(e.entity_id);
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

          {chosen.key === "button" && (
            <input
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="Service (optional, e.g. script.turn_on)"
              className="w-full rounded-xl border border-line/10 bg-fg/5 px-3 py-2 text-sm text-fg outline-none"
            />
          )}

          {chosen.needs === "text" && (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Markdown… (# Heading, **bold**, - list)"
              rows={6}
              className="w-full rounded-xl border border-line/10 bg-fg/5 px-3 py-2 text-sm text-fg outline-none"
            />
          )}

          {chosen.needs === "url" && (
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-xl border border-line/10 bg-fg/5 px-3 py-2 text-sm text-fg outline-none"
            />
          )}
        </div>
      )}
    </Modal>
  );
}
