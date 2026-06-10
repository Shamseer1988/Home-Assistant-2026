"use client";

import { useConditionsMet, type Condition } from "@/lib/conditions";
import type { DashItem } from "@/lib/types";
import { DashCard } from "./DashCard";

/**
 * Renders a dashboard card, honouring its optional visibility conditions
 * (config.conditions). When the conditions aren't met the card — and its grid
 * cell — disappear entirely.
 */
export function ConditionalCard({ item, className }: { item: DashItem; className?: string }) {
  const met = useConditionsMet(item.config?.conditions as Condition[] | undefined);
  if (!met) return null;
  return (
    <div className={className}>
      <DashCard item={item} />
    </div>
  );
}
