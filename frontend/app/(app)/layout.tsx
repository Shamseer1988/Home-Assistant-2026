import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

// Everything in this route group is rendered inside the dashboard shell
// (sidebar / header / bottom nav). /login sits outside the group, so it has
// none of this chrome.
export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
