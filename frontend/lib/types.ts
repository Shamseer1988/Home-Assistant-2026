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
