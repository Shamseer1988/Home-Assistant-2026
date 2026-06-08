export interface ServiceLink {
  name: string;
  url: string;
  description?: string;
}

// Your self-hosted services to embed on the "More" page.
// Edit these URLs (they are baked into the frontend build).
export const SERVICE_LINKS: ServiceLink[] = [
  { name: "Grafana", url: "https://dash.faizzyworld.com", description: "Metrics & dashboards" },
  { name: "Jellyfin", url: "https://jellyfin.faizzyworld.com", description: "Media server" },
];
