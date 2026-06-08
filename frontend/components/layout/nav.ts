import {
  Cctv,
  CloudSun,
  Home,
  LayoutGrid,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Cameras", icon: Cctv, href: "/cameras" },
  { label: "Energy", icon: Zap, href: "/energy" },
  { label: "Weather", icon: CloudSun, href: "/weather" },
  { label: "Security", icon: ShieldCheck, href: "/security" },
  { label: "More", icon: LayoutGrid, href: "/more" },
];
