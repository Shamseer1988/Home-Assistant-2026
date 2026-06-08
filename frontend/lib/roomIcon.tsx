import {
  Bath,
  Bed,
  Car,
  Footprints,
  Home,
  LayoutGrid,
  Sofa,
  Sun,
  Trees,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

/** Pick a friendly icon for a room/section from its name. */
export function roomIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("bed")) return Bed;
  if (n.includes("living")) return Sofa;
  if (n.includes("kitchen") || n.includes("dining")) return UtensilsCrossed;
  if (n.includes("bath")) return Bath;
  if (n.includes("stair")) return Footprints;
  if (n.includes("outdoor") || n.includes("garden") || n.includes("sitout"))
    return Trees;
  if (n.includes("solar")) return Sun;
  if (n.includes("porch") || n.includes("car")) return Car;
  if (n.includes("other") || n.includes("unassigned")) return LayoutGrid;
  return Home;
}
