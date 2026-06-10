import { API_URL, apiGet } from "./api";
import type { AdminLayout, PickerEntity } from "./types";

export const fetchLayout = (dashboardId?: number, viewId?: number) => {
  const p = new URLSearchParams();
  if (dashboardId) p.set("dashboard_id", String(dashboardId));
  if (viewId) p.set("view_id", String(viewId));
  const qs = p.toString();
  return apiGet<AdminLayout>(`/api/admin/layout${qs ? `?${qs}` : ""}`);
};

export interface ViewMeta {
  id: number;
  name: string;
  icon: string | null;
  sort: number;
}
export const createView = (dashboardId: number, name: string) =>
  send<ViewMeta>("POST", `/api/admin/dashboards/${dashboardId}/views`, { name });
export const updateView = (id: number, data: { name?: string; icon?: string | null }) =>
  send("PATCH", `/api/admin/views/${id}`, data);
export const deleteView = (id: number) => send("DELETE", `/api/admin/views/${id}`);
export const reorderViews = (order: number[]) =>
  send("POST", "/api/admin/views/reorder", { order });
export const fetchPickerEntities = () =>
  apiGet<PickerEntity[]>("/api/admin/entities");

export interface DashboardMeta {
  id: number;
  name: string;
  slug: string;
  is_default: boolean;
  hidden: boolean;
  sort: number;
}
export const fetchAdminDashboards = () =>
  apiGet<DashboardMeta[]>("/api/admin/dashboards");
export const createDashboard = (name: string) =>
  send("POST", "/api/admin/dashboards", { name });
export const updateDashboard = (
  id: number,
  data: { name?: string; hidden?: boolean; is_default?: boolean }
) => send("PATCH", `/api/admin/dashboards/${id}`, data);
export const deleteDashboard = (id: number) =>
  send("DELETE", `/api/admin/dashboards/${id}`);

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
export const createSection = (name: string, dashboardId?: number, viewId?: number) =>
  send("POST", "/api/admin/sections", { name, dashboard_id: dashboardId, view_id: viewId });

export interface NewCard {
  type: string;
  entity_id?: string;
  label?: string;
  icon?: string;
  config?: Record<string, unknown>;
}
export const createCard = (sectionId: number, card: NewCard) =>
  send("POST", `/api/admin/sections/${sectionId}/cards`, card);
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
