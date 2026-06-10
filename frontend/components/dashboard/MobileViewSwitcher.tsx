"use client";

import type { DashView } from "@/lib/types";

/**
 * A floating, horizontally-scrollable view switcher that sits just above the
 * bottom navigation on phones. Hidden on tablet/desktop, where the top tabs
 * take over. Only shown when a dashboard has more than one view.
 */
export function MobileViewSwitcher({
  views,
  activeId,
  onSelect,
}: {
  views: DashView[];
  activeId: number | null;
  onSelect: (id: number) => void;
}) {
  if (views.length < 2) return null;
  return (
    <div className="fixed inset-x-0 bottom-[4.75rem] z-30 flex justify-center px-4 md:hidden">
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-line/10 bg-panel/85 p-1 shadow-lg backdrop-blur-xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {views.map((v) => {
          const active = v.id === activeId;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v.id)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-gradient-to-br from-sidra-blue to-sidra-sky text-white shadow"
                  : "text-muted hover:text-fg"
              }`}
            >
              {v.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
