import { apiGet } from "./api";
import type { DashConfig } from "./types";

export interface DashboardMeta {
  id: number;
  name: string;
  slug: string;
  is_default: boolean;
  hidden: boolean;
  sort: number;
}

export const fetchDashboards = () => apiGet<DashboardMeta[]>("/api/dashboards");
export const fetchDashboardBySlug = (slug: string) =>
  apiGet<DashConfig>(`/api/dashboard/${slug}`);
