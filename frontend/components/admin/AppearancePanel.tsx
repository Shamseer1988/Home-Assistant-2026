"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Palette, RotateCcw } from "lucide-react";
import { setSetting } from "@/lib/admin";
import { useSettings } from "@/lib/useSettings";
import {
  ACCENT_PRESETS,
  DEFAULT_ACCENT,
  applyAccent,
  lighten,
  type AccentValue,
} from "@/lib/accent";
import { Card } from "@/components/ui/Card";

export function AppearancePanel() {
  const qc = useQueryClient();
  const { data } = useSettings();
  const current = (data as { accent?: AccentValue } | undefined)?.accent || null;
  const activeBlue = (current?.blue || DEFAULT_ACCENT.blue).toLowerCase();

  const [custom, setCustom] = useState(current?.blue || DEFAULT_ACCENT.blue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (accent: AccentValue | null) => {
    setBusy(true);
    setError(null);
    applyAccent(accent); // optimistic, instant feedback
    try {
      await setSetting("accent", accent);
      await qc.invalidateQueries({ queryKey: ["settings"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the theme.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-sidra-sky" />
        <h2 className="font-semibold text-fg">Appearance</h2>
        {busy && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
      </div>
      <p className="text-sm text-muted">
        Pick an accent colour for buttons, highlights, gradients and charts across the whole
        dashboard.
      </p>

      <div className="flex flex-wrap gap-2.5">
        {ACCENT_PRESETS.map((p) => {
          const active = activeBlue === p.blue.toLowerCase();
          return (
            <button
              key={p.id}
              type="button"
              title={p.name}
              onClick={() => {
                setCustom(p.blue);
                save({ blue: p.blue, sky: p.sky });
              }}
              style={{ backgroundImage: `linear-gradient(135deg, ${p.blue}, ${p.sky})` }}
              className={`flex h-10 w-10 items-center justify-center rounded-full shadow transition ${
                active
                  ? "ring-2 ring-fg ring-offset-2 ring-offset-panel"
                  : "hover:scale-105"
              }`}
            >
              {active && <Check className="h-4 w-4 text-white drop-shadow" />}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line/10 pt-3">
        <label className="flex items-center gap-2 text-sm text-muted">
          Custom
          <input
            type="color"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-line/10 bg-transparent"
          />
        </label>
        <button
          type="button"
          onClick={() => save({ blue: custom, sky: lighten(custom) })}
          className="rounded-xl bg-gradient-to-br from-sidra-blue to-sidra-sky px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => {
            setCustom(DEFAULT_ACCENT.blue);
            save(null);
          }}
          className="ml-auto flex items-center gap-1.5 rounded-xl border border-line/10 bg-fg/[0.04] px-3 py-1.5 text-sm text-muted transition hover:bg-fg/[0.08] hover:text-fg"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}
    </Card>
  );
}
