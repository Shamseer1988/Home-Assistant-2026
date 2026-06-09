import { API_URL, apiGet } from "./api";
import type { AdminLayout, PickerEntity } from "./types";

export const fetchLayout = () => apiGet<AdminLayout>("/api/admin/layout");
export const fetchPickerEntities = () =>
  apiGet<PickerEntity[]>("/api/admin/entities");

async function send<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const e = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(e.error || `${method} ${path} -> ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Sections (rooms)
export const createSection = (name: string, icon?: string) =>
  send("POST", "/api/admin/sections", { name, icon });
export const updateSection = (
  id: number,
  data: { name?: string; icon?: string | null; hidden?: boolean }
) => send("PATCH", `/api/admin/sections/${id}`, data);

export const setSetting = (key: string, value: unknown) =>
  send("PUT", `/api/admin/settings/${key}`, { value });
export const deleteSection = (id: number) =>
  send("DELETE", `/api/admin/sections/${id}`);
export const reorderSections = (order: number[]) =>
  send("POST", "/api/admin/sections/reorder", { order });

// Items (tiles)
export const addItems = (sectionId: number, entityIds: string[]) =>
  send("POST", `/api/admin/sections/${sectionId}/items`, {
    entity_ids: entityIds,
  });
export const updateItem = (
  id: number,
  data: { label?: string | null; section_id?: number; hidden?: boolean }
) => send("PATCH", `/api/admin/items/${id}`, data);
export const deleteItem = (id: number) =>
  send("DELETE", `/api/admin/items/${id}`);
export const reorderItems = (sectionId: number, order: number[]) =>
  send("POST", `/api/admin/sections/${sectionId}/items/reorder`, { order });
