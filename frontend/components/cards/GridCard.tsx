"use client";

import { type ChildCard, toChildItem } from "@/lib/childCard";
import { DashCard } from "./DashCard";

const COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

/** A column grid of nested cards. */
export function GridCard({ cards, columns }: { cards?: ChildCard[]; columns?: number }) {
  const list = Array.isArray(cards) ? cards : [];
  if (list.length === 0) return null;
  const cls = COLS[columns || 2] || COLS[2];
  return (
    <div className={`grid gap-3 ${cls}`}>
      {list.map((c, i) => (
        <DashCard key={i} item={toChildItem(c, i)} />
      ))}
    </div>
  );
}
