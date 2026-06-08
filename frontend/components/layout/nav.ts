import {
  Home,
  LayoutGrid,
  Zap,
  CloudSun,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

// Phase 1: single dashboard page. Other destinations land in later phases.
export const NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Devices", icon: LayoutGrid, href: "/devices" },
  { label: "Energy", icon: Zap, href: "/energy" },
  { label: "Weather", icon: CloudSun, href: "/weather" },
  { label: "Settings", icon: Settings, href: "/settings" },
];
