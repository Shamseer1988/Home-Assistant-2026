export interface HAEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed?: string;
  last_updated?: string;
}

export interface Health {
  status: string;
  ha_configured: boolean;
  ha_connected: boolean;
  entity_count: number;
}

export interface DashItem {
  id: number;
  type: string;
  entity_id: string | null;
  label: string | null;
  icon: string | null;
}

export interface DashSection {
  id: number;
  name: string;
  icon: string | null;
  items: DashItem[];
}

export interface DashConfig {
  id: number | null;
  name: string | null;
  slug: string | null;
  sections: DashSection[];
}

// ---- Admin builder shapes ----
export interface AdminOverride {
  entity_id: string;
  friendly_name: string | null;
  icon: string | null;
  hidden: boolean;
}

export interface AdminItem {
  id: number;
  section_id: number;
  type: string;
  entity_id: string | null;
  label: string | null;
  icon: string | null;
  sort: number;
  live_name: string | null;
  override: AdminOverride | null;
}

export interface AdminSection {
  id: number;
  name: string;
  icon: string | null;
  sort: number;
  items: AdminItem[];
}

export interface AdminLayout {
  id: number | null;
  name: string | null;
  sections: AdminSection[];
}

export interface PickerEntity {
  entity_id: string;
  name: string;
  domain: string;
  state: string;
}

export interface HistoryPoint {
  t: string;
  v: number;
}

export interface HistorySeries {
  entity_id: string;
  points: HistoryPoint[];
}

export interface ForecastItem {
  datetime: string;
  condition?: string;
  temperature?: number;
  templow?: number;
  precipitation?: number;
  [key: string]: unknown;
}
