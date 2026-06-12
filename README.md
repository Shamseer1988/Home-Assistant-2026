# SIDRA Dashboard 2026

A modern, responsive smart-home dashboard for **Home Assistant** — a **standalone
Flask + Next.js app** with a live, glassmorphic UI and a full admin builder, so
you can design dashboards **without touching YAML**.

It runs in **Docker inside a Proxmox LXC container**, separate from the Home
Assistant server, and talks to HA over the LAN via its REST + WebSocket API.

> Architecture & design notes: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) ·
> Production deployment: [`docs/DEPLOY.md`](docs/DEPLOY.md)

---

## Highlights

**Live & connected**
- Connects to Home Assistant over REST **and** WebSocket, with an in-memory
  snapshot and **live `state_changed` streaming** to every browser via Socket.IO.
- Token-free **camera snapshot + live MJPEG** proxy, image proxy (avatars / media
  art), history sparklines, and weather forecasts — all proxied so no HA token
  ever reaches the browser.

**A real dashboard builder (Lovelace-class)**
- **Multiple dashboards**, each with **views (tabs)** and **rooms (sections)**.
- **12 card types** in a searchable, categorised catalog: entity, button, gauge,
  graph, glance, entities-list, camera, weather, markdown, website (iframe), and
  **Stack / Grid containers** that nest other cards.
- **Drag-and-drop** everywhere — reorder rooms, cards, and container children.
- Per-card **config, width, colour, visibility conditions**, and
  **tap / hold / double-tap actions** (more-info, toggle, navigate, URL, service).
- **Live card preview** while editing; **duplicate** any card.
- **HA-style view badges** (live entity chips) and **markdown templates**
  (`{{ sensor.temp }}` interpolates live values).
- **Import / export** a dashboard as portable JSON.

**Multi-user**
- **Login with Home Assistant accounts** (validated against HA), plus a local
  break-glass admin. JWT in httpOnly cookies.
- **Per-dashboard access control** (everyone / admins / specific people) and
  **admin vs user roles** — admins and the home dashboard are always reachable, so
  no one gets locked out.
- **Per-user landing dashboard** (where each person starts after sign-in).

**Premium polish**
- **Light / dark** theme + a customisable **accent colour** (presets or custom)
  that themes the whole UI and charts.
- Framer-motion animations, a mobile view-switcher, a **quick-actions bar** of
  one-tap scenes/scripts, and an installable **PWA**.
- Curated special pages: **Cameras**, **Energy**, **Weather**, **Security**, **More**.

**Hardened for deployment**
- Single-origin HTTPS via **Caddy** (auto TLS), rate limiting, security headers,
  `ProxyFix` for correct client IPs, and a tested additive **SQLite migration**
  path so upgrades never lose data.

---

## Tech stack

| Layer | Tech |
|------|------|
| Backend | Flask (app-factory + blueprints), Flask-SocketIO, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Limiter, `websocket-client`, gunicorn |
| Frontend | Next.js 14 (App Router, standalone), React 18, Tailwind CSS, TanStack Query, Zustand, socket.io-client, framer-motion, @dnd-kit, lucide-react |
| Data | SQLite (layout, users, settings) on a Docker volume |
| Deploy | Docker Compose; Caddy reverse proxy for production HTTPS |

---

## Quick start (Docker)

### 1. Prerequisites
- A Proxmox LXC container with Docker + Docker Compose (enable **nesting** on the
  LXC if running Docker inside it).
- A Home Assistant **Long-Lived Access Token**
  (HA → Profile → Security → Long-Lived Access Tokens).

### 2. Configure
```bash
cp .env.example .env
# Edit .env — the essentials:
#   HA_BASE_URL    -> your HA URL, e.g. http://192.168.1.10:8123
#   HA_TOKEN       -> your long-lived token
#   ADMIN_USERNAME / ADMIN_PASSWORD -> the seeded break-glass admin (CHANGE THESE)
#   PUBLIC_API_URL -> http://<this-LXC-ip>:5000   (URL the browser uses)
#   CORS_ORIGINS   -> http://<this-LXC-ip>:3000   (or * while testing)
```

### 3. Run
```bash
docker compose up --build
```
- Dashboard: `http://<lxc-ip>:3000`
- Backend health: `http://<lxc-ip>:5000/api/health`

Sign in with a Home Assistant account (`AUTH_MODE=ha`) or the seeded admin. On
first boot, with `HA_TOKEN` set, the app auto-imports a starter dashboard from
your HA areas.

### Production (single-origin HTTPS)
Use the Caddy stack for one clean origin with automatic TLS:
```bash
SIDRA_DOMAIN=sidra.example.com docker compose -f docker-compose.prod.yml up --build -d
```
See [`docs/DEPLOY.md`](docs/DEPLOY.md). Set `JWT_COOKIE_SECURE=true` and
`TRUST_PROXY=true` when serving over HTTPS.

---

## Configuration

All configuration is via `.env` (see [`.env.example`](.env.example)).

| Variable | Purpose | Default |
|---------|---------|---------|
| `HA_BASE_URL` | Home Assistant URL (LAN IP/hostname, **not** localhost) | `http://homeassistant.local:8123` |
| `HA_WS_URL` | WebSocket URL; blank = auto-derive from `HA_BASE_URL` | _(derived)_ |
| `HA_TOKEN` | Long-Lived Access Token | _(required)_ |
| `HA_VERIFY_SSL` | Set `false` for self-signed HA certs | `true` |
| `AUTH_MODE` | `ha` (HA accounts + local admin) or `local` | `ha` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Seeded admin (first boot) | `admin` / `admin` |
| `SECRET_KEY` / `JWT_SECRET_KEY` | Signing secrets (use long random strings) | dev default |
| `DATABASE_URL` | SQLAlchemy URL | `sqlite:////data/sidra.db` |
| `CORS_ORIGINS` | Allowed browser origins (comma-list or `*`) | `*` |
| `TRUST_PROXY` | Honour `X-Forwarded-*` (enable behind Caddy) | `false` |
| `RATELIMIT_ENABLED` | Login/route rate limiting | `true` |
| `JWT_COOKIE_SECURE` | Mark auth cookie Secure (HTTPS only) | `false` |
| `PUBLIC_API_URL` | Browser-facing API URL, **baked into the frontend build** (simple compose only) | — |
| `SIDRA_DOMAIN` | Domain Caddy serves (prod) | — |

---

## Local development (without Docker)

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export $(grep -v '^#' ../.env | xargs)   # or set HA_BASE_URL / HA_TOKEN
python wsgi.py                            # http://localhost:5000
```

**Frontend**
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:5000 npm run dev   # http://localhost:3000
```

---

## Project structure

```
backend/
  app/
    api/         # blueprints: health, ha, auth, dashboard, admin, admin_layout
    models/      # Dashboard → View → Section → SectionItem, User, Setting, AuditLog
    services/    # HA REST client, WebSocket bridge, state store, area importer
    sockets/     # Socket.IO event handlers
    __init__.py  # app factory + additive SQLite migrations + seed admin
  tests/         # pytest
frontend/
  app/           # Next.js App Router (home, /d/[slug], /admin, special pages, /login)
  components/    # cards, dashboard, admin, home, layout, ui, detail
  lib/           # api client, hooks, card types, conditions, tap actions, templates
  store/         # Zustand stores (entities, detail, toast)
docs/            # ARCHITECTURE.md, DEPLOY.md
docker-compose.yml / docker-compose.prod.yml / Caddyfile / .env.example
```

---

## API reference

Base URL is the backend (`:5000`, or same-origin behind Caddy).
Admin routes require a JWT with the `admin` role.

**System & Home Assistant proxy**
| Method | Path | Description |
|-------:|------|-------------|
| GET | `/api/health` | Backend + HA status, entity count |
| GET | `/api/ha/states` · `/api/ha/states/<id>` | Cached entity snapshot / one entity |
| POST | `/api/ha/services/<domain>/<service>` | Call a service (body = service data) |
| GET | `/api/ha/history/<id>?hours=` | Numeric history for sparklines |
| GET | `/api/ha/camera/<id>` · `/api/ha/camera_stream/<id>` | Snapshot / live MJPEG proxy |
| GET | `/api/ha/forecast/<id>?type=` | Weather forecast |
| GET | `/api/ha/image?path=` · `/api/ha/areas` · `/api/ha/config` | Image proxy / registries / config |
| WS  | `/socket.io` | `snapshot` then `state_changed` / `state_removed` |

**Auth**
| Method | Path | Description |
|-------:|------|-------------|
| POST | `/api/auth/login` · `/api/auth/logout` · `/api/auth/refresh` | Sign in / out / rotate token |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/landing` | Set/clear personal landing dashboard |

**Public dashboard**
| Method | Path | Description |
|-------:|------|-------------|
| GET | `/api/settings` | Public settings (themes, badges, quick actions, …) |
| GET | `/api/dashboards` | Dashboards the viewer may access |
| GET | `/api/dashboard` · `/api/dashboard/<slug>` | Default / named dashboard tree |

**Admin** (`/api/admin`, admin role)
| Group | Routes |
|------|--------|
| Layout | `GET /layout`, `GET /entities`, `GET /audit`, `GET /overview`, `POST /import` |
| Dashboards | `GET/POST /dashboards`, `PATCH/DELETE /dashboards/<id>`, `POST /dashboards/reorder`, `GET /dashboards/<id>/export`, `POST /dashboards/import` |
| Views | `POST /dashboards/<id>/views`, `PATCH/DELETE /views/<id>`, `POST /views/reorder` |
| Sections | `POST /sections`, `PATCH/DELETE /sections/<id>`, `POST /sections/reorder` |
| Items / cards | `POST /sections/<id>/items`, `POST /sections/<id>/cards`, `PATCH/DELETE /items/<id>`, `POST /items/<id>/duplicate`, `POST /sections/<id>/items/reorder` |
| Users | `GET /users`, `PATCH /users/<id>` (role) |
| Overrides / settings | `PUT/DELETE /overrides/<entity_id>`, `PUT /settings/<key>` |

---

## Testing

```bash
# Backend
cd backend && source .venv/bin/activate && python -m pytest -q

# Frontend
cd frontend && npx tsc --noEmit && npm run build
```

The backend suite covers auth, access control, role guards, dashboard CRUD,
export/import, duplication, badges, and the landing-page preference.

---

## Security notes

- JWTs live in **httpOnly cookies** (XSS-safe); `Lax` same-site, with `Secure`
  enabled over HTTPS.
- Login is **rate-limited**; admin routes require the `admin` role.
- The HA token stays server-side — the browser only ever sees proxied data.
- Per-dashboard access control filters both the switcher list and direct access.
- Behind Caddy, `TRUST_PROXY=true` gives correct client IPs to the limiter.

---

*SIDRA is an independent project and is not affiliated with Home Assistant.*
