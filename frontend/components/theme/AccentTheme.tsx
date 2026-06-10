"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/useSettings";
import { applyAccent, type AccentValue } from "@/lib/accent";

const LS_KEY = "sidra:accent";

/**
 * Applies the saved brand accent to the document. Mounted once in the app
 * shell so it themes the whole dashboard for every signed-in user. A
 * localStorage cache lets us paint the right colour before settings load.
 */
export function AccentTheme() {
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LS_KEY);
      if (cached) applyAccent(JSON.parse(cached) as AccentValue);
    } catch {
      /* ignore */
    }
  }, []);

  const { data } = useSettings();
  useEffect(() => {
    if (!data) return;
    const accent = (data as { accent?: AccentValue }).accent ?? null;
    applyAccent(accent && accent.blue ? accent : null);
    try {
      if (accent && accent.blue) localStorage.setItem(LS_KEY, JSON.stringify(accent));
      else localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
  }, [data]);

  return null;
}
