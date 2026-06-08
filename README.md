# SIDRA Dashboard 2026

A modern, responsive smart-home dashboard for **Home Assistant** — a standalone
**Flask + Next.js** app with a live, glassmorphic UI and (from Phase 2) an admin
backend to build the dashboard without editing YAML.

It runs in **Docker inside a Proxmox LXC container**, separate from the Home
Assistant server, and connects to HA over the LAN via its API.

> See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full design and the
> phase-by-phase roadmap. This repo currently contains **Phase 0 + Phase 1**.

---

## What works now (Phases 0–5)

- Flask backend that connects to Home Assistant over REST **and** WebSocket,
  with an in-memory snapshot + **live `state_changed` streaming** via Socket.IO.
- Next.js dashboard (mobile / tablet / laptop) with **rooms** — entities grouped
  by Home Assistant area — plus a connection indicator and live stats.
- **End-to-end control:** toggle a real light/switch/fan and watch every client
  update in real time.
- **Rich controls:** tap a tile (or its ⤢ button) for an animated detail sheet —
  light brightness/colour, fan speed, a climate dial, cover & volume sliders,
  media transport, and 24h sensor sparklines.
- **Installable PWA** (manifest + icons) for phones and wall tablets.
- **Admin login** (JWT cookies) with a protected `/admin` area, and a one-click
  **"Sync rooms from Home Assistant"** importer that builds the layout from your
  areas (disabled/hidden/diagnostic entities skipped). The layout persists in
  SQLite; before any import the dashboard falls back to grouping by type.
- **Dashboard builder** at `/admin/builder`: add / rename / reorder / delete
  rooms, add entities via a searchable picker, and remove / rename / reorder /
  move tiles between rooms — all persisted, no YAML. Admin actions are logged.

---

## Quick start

### 1. Prerequisites
- A Proxmox LXC container with Docker + Docker Compose installed
  (enable nesting on the LXC if running Docker inside it).
- A Home Assistant **Long-Lived Access Token**
  (HA → Profile → Security → Long-Lived Access Tokens).

### 2. Configure
```bash
cp .env.example .env
# Edit .env:
#   HA_BASE_URL   -> your HA server URL (e.g. http://192.168.1.10:8123)
#   HA_TOKEN      -> your long-lived token
#   PUBLIC_API_URL-> http://<this-LXC-ip>:5000  (URL the browser uses)
#   CORS_ORIGINS  -> http://<this-LXC-ip>:3000  (or * while testing)
```

### 3. Run
```bash
docker compose up --build
```
- Dashboard: `http://<lxc-ip>:3000`
- Backend health: `http://<lxc-ip>:5000/api/health`

---

## Local development (without Docker)

Backend:
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export $(grep -v '^#' ../.env | xargs)   # or set HA_BASE_URL / HA_TOKEN
python wsgi.py
```

Frontend:
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:5000 npm run dev
```

---

## API (Phase 1)

| Method | Path | Description |
|-------:|------|-------------|
| GET  | `/api/health` | Backend + HA connection status, entity count |
| GET  | `/api/ha/states` | Cached snapshot of all entity states |
| GET  | `/api/ha/states/<entity_id>` | One entity's state |
| POST | `/api/ha/services/<domain>/<service>` | Call a HA service (body = service data) |
| GET  | `/api/ha/history/<entity_id>?hours=` | Numeric history for sparklines |
| GET  | `/api/ha/areas` | Area / device / entity registries (for future room grouping) |
| GET  | `/api/ha/config` | Home Assistant config (location, version) |
| WS   | `/socket.io` | `snapshot` on connect, then `state_changed` / `state_removed` |
| POST | `/api/auth/login` | Sign in; sets httpOnly JWT cookies |
| POST | `/api/auth/logout` | Clear auth cookies |
| POST | `/api/auth/refresh` | Rotate the access token (refresh cookie) |
| GET  | `/api/auth/me` | Current user (401 if not signed in) |
| GET  | `/api/dashboard` | Default dashboard tree (rooms + tiles), overrides applied |
| GET  | `/api/admin/overview` | Admin-only stats (JWT + admin role) |
| POST | `/api/admin/import` | Admin-only: (re)build rooms from HA areas |
| GET  | `/api/admin/layout` | Editable room/tile tree |
| GET  | `/api/admin/entities` | Searchable entity list for the picker |
| —    | `/api/admin/sections[/…]` | Rooms: create / update / delete / reorder |
| —    | `/api/admin/items[/…]` | Tiles: add / update / move / delete / reorder |
| PUT  | `/api/admin/overrides/<entity_id>` | Override a name/icon or hide an entity |
| GET  | `/api/admin/audit` | Recent admin actions |

## Admin login (Phase 2)

The dashboard at `/` is open for viewing and device control. Editing the
dashboard lives behind a login at `/admin` (link in the header).

- On first boot the backend seeds an admin from `.env`
  (`ADMIN_USERNAME` / `ADMIN_PASSWORD`) — **set these before first run**.
- Auth uses JWT in httpOnly cookies (XSS-safe); the SQLite DB persists on the
  `sidra-data` volume.
- Phase 3/4 plug the dashboard-builder CRUD into this gate.

---

## Roadmap

Phase 0/1 done. Next: **Phase 2** (auth + admin), **Phase 3** (DB-driven dashboard
seeded from your HA areas), **Phase 4** (full admin CRUD). See the architecture doc.
