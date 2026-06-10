"use client";

import { isOn, isUnavailable } from "./ha";
import type { HAEntity } from "./types";
import { useEntityStore } from "@/store/entities";

export interface Condition {
  entity: string;
  op: string;
  value?: string;
}

export const CONDITION_OPS: { value: string; label: string; needsValue: boolean }[] = [
  { value: "on", label: "is on", needsValue: false },
  { value: "off", label: "is off", needsValue: false },
  { value: "is", label: "state is", needsValue: true },
  { value: "not", label: "state is not", needsValue: true },
  { value: "above", label: "is above", needsValue: true },
  { value: "below", label: "is below", needsValue: true },
  { value: "available", label: "is available", needsValue: false },
  { value: "unavailable", label: "is unavailable", needsValue: false },
];

export const opNeedsValue = (op: string): boolean =>
  CONDITION_OPS.find((o) => o.value === op)?.needsValue ?? false;

function evalOne(c: Condition, e: HAEntity | undefined): boolean {
  if (!e) return c.op === "unavailable"; // a missing entity counts as unavailable
  switch (c.op) {
    case "on":
      return isOn(e);
    case "off":
      return !isOn(e) && !isUnavailable(e);
    case "is":
      return e.state === (c.value ?? "");
    case "not":
      return e.state !== (c.value ?? "");
    case "above":
      return parseFloat(e.state) > parseFloat(c.value ?? "");
    case "below":
      return parseFloat(e.state) < parseFloat(c.value ?? "");
    case "available":
      return !isUnavailable(e);
    case "unavailable":
      return isUnavailable(e);
    default:
      return true;
  }
}

/** All conditions must hold (AND). No conditions => always visible. */
export function evaluateConditions(
  conditions: Condition[] | undefined | null,
  entities: Record<string, HAEntity>
): boolean {
  if (!Array.isArray(conditions) || conditions.length === 0) return true;
  return conditions.every((c) => (c.entity ? evalOne(c, entities[c.entity]) : true));
}

/** Reactively report whether a card's visibility conditions are currently met. */
export function useConditionsMet(conditions: Condition[] | undefined | null): boolean {
  return useEntityStore((s) => evaluateConditions(conditions, s.entities));
}

/** Coerce arbitrary stored JSON into a clean Condition[]. */
export function normalizeConditions(raw: unknown): Condition[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c): c is Condition => !!c && typeof c === "object" && typeof (c as Condition).entity === "string")
    .map((c) => ({ entity: c.entity, op: c.op || "on", value: c.value }));
}
