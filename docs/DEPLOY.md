# Deploying SIDRA Dashboard

Two supported setups. Both run in Docker on your Proxmox LXC container, separate
from the Home Assistant server.

| | Origin | HTTPS | Use when |
|---|---|---|---|
| **Simple** (`docker-compose.yml`) | two ports (`:3000` + `:5000`) | no | quick LAN testing |
| **Production** (`docker-compose.prod.yml`) | single origin via Caddy | yes | day-to-day use |

---

## 1. Configure

```bash
cp .env.example .env
```

Set at minimum:

- `HA_BASE_URL`, `HA_TOKEN` — your Home Assistant URL + long-lived token
- `SECRET_KEY` — a long random string (`openssl rand -hex 32`)
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` — seeded on first boot

For **production** also set:

- `SIDRA_DOMAIN` — the domain/host Caddy serves
- `JWT_COOKIE_SECURE=true` — mark the auth cookie Secure (HTTPS only)

---

## 2a. Simple (HTTP, two ports)

```bash
docker compose up -d --build
```

Dashboard `http://<lxc-ip>:3000`, API `http://<lxc-ip>:5000`. Set
`PUBLIC_API_URL=http://<lxc-ip>:5000` in `.env` before building so the browser
can reach the backend.

## 2b. Production (HTTPS, single origin)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Caddy serves everything on one origin and proxies `/api` + `/socket.io` to the
backend, so the browser talks same-origin (no CORS, clean cookies, installable
PWA). Only ports 80/443 are exposed.

**TLS options** (see `Caddyfile`):

- **Public domain** — point DNS at the host, open 80/443 → Caddy fetches a
  Let's Encrypt certificate automatically.
- **LAN / IP** — set `SIDRA_DOMAIN` to your hostname/IP, uncomment `tls internal`
  in the `Caddyfile`, then install Caddy's root CA (in the `caddy-data` volume
  under `/data/caddy/pki`) on your devices.

---

## 3. Backups

State lives in the `sidra-data` Docker volume (`/data/sidra.db` — users and the
dashboard layout). Live device data is always re-read from Home Assistant.

```bash
# Back up
docker run --rm -v sidra-data:/data -v "$PWD":/backup alpine \
  cp /data/sidra.db /backup/sidra-backup.db

# Restore (stop the stack first)
docker run --rm -v sidra-data:/data -v "$PWD":/backup alpine \
  cp /backup/sidra-backup.db /data/sidra.db
```

---

## 4. Security checklist

- [x] HA token stays server-side; the browser only talks to the backend
- [x] Admin auth via JWT in httpOnly cookies; `SameSite=Lax`
- [x] `JWT_COOKIE_SECURE=true` and HTTPS in production
- [x] Login rate-limited (10/min, 50/hour); `TRUST_PROXY=true` behind Caddy
- [x] Security headers on API and frontend responses
- [ ] Change `ADMIN_PASSWORD` and `SECRET_KEY` from their defaults
- [ ] Restrict who can reach ports 80/443 (firewall / VPN) as desired

---

## 5. Tests

```bash
cd backend
pip install -r requirements-dev.txt
python -m pytest
```

Covers the importer grouping, the auth flow, and the dashboard CRUD/overrides.
