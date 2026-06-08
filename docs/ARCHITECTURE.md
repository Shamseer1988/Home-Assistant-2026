# SIDRA Dashboard 2026 — Architecture

A modern, mobile/tablet/laptop-friendly web app that replaces the SIDRA Lovelace
YAML dashboard with a standalone **Flask + Next.js** application that talks to
Home Assistant over its API and adds an **admin backend** for managing the
dashboard (sections, cards, entities) without editing YAML.

> The app is **non-destructive**: it reads live state and calls services through
> the Home Assistant API. It never edits your Home Assistant configuration or the
> existing `Dahsboard.yaml`.

---

## 1. Deployment model

- **Runs in:** Docker (Docker Compose) inside a **Proxmox LXC container**.
- **Separate** from the Home Assistant server — the backend reaches HA over the
  LAN using `HA_BASE_URL` + a Long-Lived Access Token.
- The browser (phone/tablet/laptop) talks **only** to the Flask backend; the HA
  token never leaves the server.

```
┌──────────────────────────── Proxmox LXC (Docker) ───────────────────────────┐
│                                                                              │
│   Next.js (frontend, :3000)  ──REST + Socket.IO──▶  Flask (backend, :5000)   │
│                                                          │                   │
└──────────────────────────────────────────────────────────┼──────────────────┘
                                                            │ REST + WebSocket
                                                            ▼  (LAN, Bearer token)
                                              ┌──────────────────────────────┐
                                              │  Home Assistant server :8123 │
                                              └──────────────────────────────┘
```

---

## 2. Tech stack

| Layer        | Choice                                                        |
|--------------|---------------------------------------------------------------|
| Backend      | Flask (app-factory + Blueprints)                              |
| Real-time    | Flask-SocketIO (threading mode) + HA WebSocket bridge thread  |
| HA link      | REST (`/api/states`, `/api/services`) + WebSocket (`state_changed`, registries) |
| Auth         | Flask-JWT-Extended + bcrypt, httpOnly cookies *(Phase 2)*     |
| DB / ORM     | SQLAlchemy + Alembic, SQLite → Postgres *(Phase 2/3)*         |
| Frontend     | Next.js (App Router) + TypeScript                            |
| UI           | Tailwind CSS + framer-motion + lucide icons                  |
| Data layer   | TanStack Query + socket.io-client + Zustand                  |
| Charts       | Recharts + custom SVG radial gauge *(Phase 5)*               |
| Mobile       | PWA (installable) *(Phase 5)*                                |

---

## 3. Backend design

```
backend/app/
├── __init__.py        # create_app(): config, extensions, blueprints, start HA bridge
├── config.py          # env-driven config (HA URL/token, CORS, port)
├── extensions.py      # socketio, cors singletons
├── services/
│   ├── ha_client.py   # HA REST: states, service calls, config
│   ├── ha_ws.py       # HA WebSocket bridge: live state_changed + registry commands
│   └── state_store.py # thread-safe in-memory snapshot of all entity states
├── api/
│   ├── health.py      # GET /api/health
│   └── ha.py          # /api/ha/states, /services/<d>/<s>, /areas, /config
└── sockets/
    └── events.py      # Socket.IO connect -> send snapshot
```

**Live data flow**

1. On boot, the backend fetches a full state snapshot via REST into `state_store`.
2. The HA WebSocket bridge authenticates, subscribes to `state_changed`, and on
   each event updates `state_store` and emits `state_changed` over Socket.IO.
3. A browser connects → receives the current `snapshot`, then live deltas.
4. Browser actions (toggle a light) → `POST /api/ha/services/...` → HA REST →
   HA fires `state_changed` → bridge → Socket.IO → every client updates.

**Why the token stays server-side:** the browser only ever sees Flask. This is
what enables the admin layer and avoids exposing HA to the LAN/clients.

---

## 4. Frontend design

```
frontend/
├── app/
│   ├── layout.tsx     # root layout + providers + AppShell
│   ├── providers.tsx  # React Query provider
│   ├── page.tsx       # dashboard (live tiles grouped by domain in Phase 1)
│   └── globals.css    # design tokens (glassmorphism palette ported from SIDRA)
├── components/
│   ├── layout/        # AppShell, Sidebar (desktop), BottomNav (mobile), Header
│   ├── cards/         # DeviceTile, StatTile, RoomSection
│   └── ui/            # Card primitive
├── lib/               # api client, socket client, types
└── store/             # Zustand entity store (live state map)
```

- Mobile-first, responsive: left icon rail on laptop/tablet → bottom tab bar on phone.
- Dark glassmorphism using SIDRA's existing palette (`#4d79ff`, `#13264d`).
- Live updates: Socket.IO `snapshot` + `state_changed` feed a Zustand store that
  re-renders only affected tiles.

---

## 5. Data model (introduced Phase 2/3)

```
users(id, username, email, password_hash, role, created_at)
dashboards(id, name, slug, is_default, sort)
sections(id, dashboard_id, name, icon, sort)              # "add section / room"
section_items(id, section_id, type, entity_id, label, icon, sort, config_json)
                                                          # "add entity to room"
entity_overrides(entity_id, friendly_name, icon, hidden)  # "update entities"
# Phase 4+: settings(key, value), audit_log(id, user_id, action, target, ts)
```

The architecture's original `cards` + `card_entities` layers were consolidated
into a single `section_items` table: each item is an entity tile today, and
`type` + `config_json` keep the door open for rich cards (weather, gauge, chart,
media) in Phase 5. Only the **layout** lives in the DB; live values come from HA.

---

## 6. Phased roadmap

| Phase | Scope | Status |
|------:|-------|--------|
| 0 | Monorepo, Docker, Flask boot, Next.js shell, live entity count | **done** |
| 1 | HA REST+WS bridge, live tiles, end-to-end toggle | **done** |
| 2 | Auth & admin foundation (JWT cookies, seeded admin, route guards) | **done** |
| 3 | Dynamic dashboard from DB + importer that seeds rooms/entities from HA areas | **done** |
| 4 | Admin builder: rooms + tiles CRUD, entity picker, reorder/move, overrides, audit | **done** |
| 5 | Rich card library, charts, animations, responsive polish, PWA | planned |
| 6 | Special views: cameras, solar/energy, water, prayer times, alarm, iframes | planned |
| 7 | Hardening: reverse proxy/HTTPS, rate limiting, tests, backups, prod deploy | planned |

---

## 7. Current home (discovered via the live HA connection)

- **Areas:** Master Bedroom, Living Room, Dining Room, Kitchen, Staircase,
  Sitout, Outdoor, Garden, Solar, Others.
- **~240 entities:** 74 lights, 91 sensors, 18 switches, 13 binary_sensors,
  9 fans, 6 cameras, 5 media players, 2 alarm panels, cover, vacuum.
- **Integrations to surface later:** Enphase Envoy solar, Electricity Maps CO₂,
  AdGuard, OpenWeather, SpeedTest, Islamic Prayer Times, Alarmo, ultrasonic
  water tank, sprinklers, person tracking; iframe embeds for Grafana, Jellyfin,
  OpnSense, RBR750, CCTV.
