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

/** Grid column span for a card type on the dashboard. */
export function cardSpan(type: string): string {
  if (["markdown", "iframe", "entities"].includes(type))
    return "col-span-2 sm:col-span-3 lg:col-span-4 xl:col-span-5";
  if (["glance", "weather", "camera", "graph"].includes(type)) return "col-span-2";
  return "";
}
