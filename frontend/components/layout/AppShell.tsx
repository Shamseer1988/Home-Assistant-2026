import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { EntityDetailSheet } from "@/components/detail/EntityDetailSheet";
import { AccentTheme } from "@/components/theme/AccentTheme";
import { Toaster } from "@/components/ui/Toaster";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AccentTheme />
      <Sidebar />
      <main className="flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10">
        <div className="mx-auto max-w-6xl">
          <Header />
          {children}
        </div>
      </main>
      <BottomNav />
      <EntityDetailSheet />
      <Toaster />
    </div>
  );
}
