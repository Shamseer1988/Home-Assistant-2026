"use client";

import { useSettings } from "./useSettings";
import { DEFAULT_ACCENT, type AccentValue } from "./accent";

function accentFromSettings(data: unknown): AccentValue | null {
  const a = (data as { accent?: AccentValue } | undefined)?.accent;
  return a && a.blue ? a : null;
}

/** The active highlight colour as a hex string (reacts to the saved theme). */
export function useAccentSky(): string {
  const { data } = useSettings();
  return accentFromSettings(data)?.sky || DEFAULT_ACCENT.sky;
}

/** The active primary colour as a hex string (reacts to the saved theme). */
export function useAccentBlue(): string {
  const { data } = useSettings();
  return accentFromSettings(data)?.blue || DEFAULT_ACCENT.blue;
}
