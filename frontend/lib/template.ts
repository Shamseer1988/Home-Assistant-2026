import { friendlyName } from "./ha";
import type { HAEntity } from "./types";

const TEMPLATE_RE = /\{\{\s*([^}]+?)\s*\}\}/g;

function resolveToken(token: string, entities: Record<string, HAEntity>): string {
  const parts = token.split(".");
  if (parts.length < 2) return ""; // not an entity reference
  const entityId = `${parts[0]}.${parts[1]}`;
  const e = entities[entityId];
  if (!e) return "";
  const attr = parts.slice(2).join(".");
  if (!attr || attr === "state") return e.state ?? "";
  if (attr === "name") return friendlyName(e);
  const v = e.attributes?.[attr];
  return v == null ? "" : String(v);
}

/**
 * Replace {{ entity_id }} placeholders with live values. Supports a trailing
 * attribute (e.g. {{ climate.ac.temperature }}) plus the shortcuts `.name`
 * (friendly name) and `.state`. Unknown references collapse to "".
 */
export function interpolateTemplate(
  content: string,
  entities: Record<string, HAEntity>
): string {
  if (!content || !content.includes("{{")) return content || "";
  return content.replace(TEMPLATE_RE, (_, token) => resolveToken(String(token).trim(), entities));
}
