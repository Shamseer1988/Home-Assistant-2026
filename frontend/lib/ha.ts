import type { HAEntity } from "./types";

export const domainOf = (entityId: string): string => entityId.split(".")[0];

export const friendlyName = (e: HAEntity): string =>
  e.attributes?.friendly_name ||
  e.entity_id.split(".")[1]?.replace(/_/g, " ") ||
  e.entity_id;

const ON_STATES = new Set([
  "on",
  "open",
  "playing",
  "home",
  "active",
  "unlocked",
  "heat",
  "cool",
]);

export const isOn = (e: HAEntity): boolean => ON_STATES.has(e.state);

export const isUnavailable = (e: HAEntity): boolean =>
  e.state === "unavailable" || e.state === "unknown";

export const isToggleable = (entityId: string): boolean =>
  ["light", "switch", "fan", "input_boolean"].includes(domainOf(entityId));

/** Human-readable state label for a tile. */
export function stateLabel(e: HAEntity): string {
  if (isUnavailable(e)) return "Unavailable";
  if (domainOf(e.entity_id) === "light" && isOn(e) && e.attributes?.brightness) {
    return `${Math.round((e.attributes.brightness / 255) * 100)}%`;
  }
  const s = e.state;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
