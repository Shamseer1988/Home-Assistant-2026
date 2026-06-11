"use client";

import { type ChildCard, toChildItem } from "@/lib/childCard";
import { DashCard } from "./DashCard";

/** A vertical stack of nested cards. */
export function StackCard({ cards }: { cards?: ChildCard[] }) {
  const list = Array.isArray(cards) ? cards : [];
  if (list.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {list.map((c, i) => (
        <DashCard key={i} item={toChildItem(c, i)} />
      ))}
    </div>
  );
}
