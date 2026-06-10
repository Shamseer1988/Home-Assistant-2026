import {
  Activity,
  Camera,
  CircleDot,
  CloudSun,
  FileText,
  Gauge,
  Globe,
  LayoutGrid,
  List,
  ToggleRight,
  type LucideIcon,
} from "lucide-react";

export type CardNeeds = "entity" | "entities" | "text" | "url" | "none";

export interface CardTypeDef {
  key: string;
  name: string;
  description: string;
  icon: LucideIcon;
  needs: CardNeeds;
}

export const CARD_TYPES: CardTypeDef[] = [
  { key: "entity", name: "Entity", description: "A single device tile.", icon: ToggleRight, needs: "entity" },
  { key: "glance", name: "Glance", description: "A compact row of entities.", icon: LayoutGrid, needs: "entities" },
  { key: "entities", name: "Entities list", description: "A vertical list of entities.", icon: List, needs: "entities" },
  { key: "gauge", name: "Gauge", description: "A radial gauge for a sensor.", icon: Gauge, needs: "entity" },
  { key: "graph", name: "Graph", description: "A sparkline of sensor history.", icon: Activity, needs: "entity" },
  { key: "button", name: "Button", description: "Toggle a device or run a service.", icon: CircleDot, needs: "entity" },
  { key: "camera", name: "Camera", description: "A camera snapshot.", icon: Camera, needs: "entity" },
  { key: "weather", name: "Weather", description: "Current conditions.", icon: CloudSun, needs: "entity" },
  { key: "markdown", name: "Markdown", description: "Custom text / notes.", icon: FileText, needs: "text" },
  { key: "iframe", name: "Website", description: "Embed a web page.", icon: Globe, needs: "url" },
];

export const CARD_LABEL: Record<string, string> = Object.fromEntries(
  CARD_TYPES.map((c) => [c.key, c.name])
);

// Width options (number of columns to span), used by the card editor.
export const WIDTH_OPTIONS: { value: string; label: string; cls: string }[] = [
  { value: "auto", label: "Auto", cls: "" },
  { value: "1", label: "1×", cls: "" },
  { value: "2", label: "2×", cls: "col-span-2" },
  { value: "3", label: "3×", cls: "col-span-2 sm:col-span-3" },
  { value: "4", label: "4×", cls: "col-span-2 sm:col-span-4" },
  { value: "full", label: "Full", cls: "col-span-2 sm:col-span-3 lg:col-span-4 xl:col-span-5" },
];
const WIDTH_CLS: Record<string, string> = Object.fromEntries(
  WIDTH_OPTIONS.map((w) => [w.value, w.cls])
);

/** Grid column span for a card — honours config.cols, else a per-type default. */
export function cardSpan(type: string, config?: Record<string, any> | null): string {
  const cols = config?.cols;
  if (cols != null && WIDTH_CLS[String(cols)] !== undefined) return WIDTH_CLS[String(cols)];
  if (["markdown", "iframe", "entities"].includes(type)) return WIDTH_CLS.full;
  if (["glance", "weather", "camera", "graph"].includes(type)) return "col-span-2";
  return "";
}

// Per-card colour choices (config.color, 6-digit hex so "#rrggbbaa" tints work).
export const CARD_COLORS: { name: string; hex: string }[] = [
  { name: "Amber", hex: "#f59e0b" },
  { name: "Orange", hex: "#fb923c" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Emerald", hex: "#10b981" },
];
