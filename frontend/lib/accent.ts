// Brand accent colour customisation.
//
// The accent drives every `sidra-blue` / `sidra-sky` Tailwind class (buttons,
// gradients, tabs, rings, highlights) via the --accent-* CSS variables, plus
// chart/slider colours through useAccentSky(). Values are stored as hex in the
// `accent` setting; applied as space-separated RGB so Tailwind's <alpha-value>
// keeps working.

export interface AccentValue {
  blue: string; // gradient start / primary
  sky: string; // gradient end / highlight
}

export interface AccentPreset extends AccentValue {
  id: string;
  name: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "sidra", name: "Sidra Blue", blue: "#4d79ff", sky: "#59a0ff" },
  { id: "violet", name: "Violet", blue: "#7c5cff", sky: "#a78bfa" },
  { id: "emerald", name: "Emerald", blue: "#0ea968", sky: "#34d399" },
  { id: "rose", name: "Rose", blue: "#f43f5e", sky: "#fb7185" },
  { id: "amber", name: "Amber", blue: "#f59e0b", sky: "#fbbf24" },
  { id: "cyan", name: "Cyan", blue: "#0891b2", sky: "#22d3ee" },
];

export const DEFAULT_ACCENT: AccentValue = ACCENT_PRESETS[0];

/** "#4d79ff" -> "77 121 255" (the form Tailwind needs); null if not a hex. */
export function hexToRgbTriplet(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Lift a hex colour towards white — used to derive `sky` from a custom pick. */
export function lighten(hex: string, amt = 0.16): string {
  const t = hexToRgbTriplet(hex);
  if (!t) return hex;
  const ch = t.split(" ").map(Number);
  const toHex = (c: number) => Math.round(c).toString(16).padStart(2, "0");
  return `#${ch.map((c) => toHex(c + (255 - c) * amt)).join("")}`;
}

/** Write (or clear) the accent CSS variables on <html>. */
export function applyAccent(accent: AccentValue | null | undefined) {
  const root = document.documentElement;
  const blue = accent?.blue ? hexToRgbTriplet(accent.blue) : null;
  const sky = accent?.sky ? hexToRgbTriplet(accent.sky) : null;
  if (blue) root.style.setProperty("--accent-blue", blue);
  else root.style.removeProperty("--accent-blue");
  if (sky) root.style.setProperty("--accent-sky", sky);
  else root.style.removeProperty("--accent-sky");
}
