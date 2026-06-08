"""Environment-driven configuration."""
import os
from datetime import timedelta

from dotenv import load_dotenv

# Best-effort: load a local .env when developing outside Docker.
load_dotenv()


def _derive_ws_url(base_url: str) -> str:
    """Turn an HA HTTP base URL into its WebSocket API URL."""
    url = base_url.rstrip("/")
    if url.startswith("https://"):
        ws = "wss://" + url[len("https://"):]
    elif url.startswith("http://"):
        ws = "ws://" + url[len("http://"):]
    else:
        ws = url
    return ws + "/api/websocket"


def _parse_origins(raw: str):
    raw = (raw or "").strip()
    if raw in ("", "*"):
        return "*"
    return [o.strip() for o in raw.split(",") if o.strip()]


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")

    # ---- Home Assistant ----
    HA_BASE_URL = os.getenv("HA_BASE_URL", "http://homeassistant.local:8123").rstrip("/")
    HA_TOKEN = os.getenv("HA_TOKEN", "")
    HA_WS_URL = os.getenv("HA_WS_URL") or _derive_ws_url(HA_BASE_URL)
    HA_VERIFY_SSL = os.getenv("HA_VERIFY_SSL", "true").lower() != "false"

    # ---- Server ----
    PORT = int(os.getenv("PORT", "5000"))
    CORS_ORIGINS = _parse_origins(os.getenv("CORS_ORIGINS", "*"))
    # Trust X-Forwarded-* headers (enable when running behind the reverse proxy).
    TRUST_PROXY = os.getenv("TRUST_PROXY", "false").lower() == "true"
    RATELIMIT_ENABLED = os.getenv("RATELIMIT_ENABLED", "true").lower() == "true"

    # ---- Database ----
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///sidra.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ---- Auth / JWT (httpOnly cookies) ----
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or SECRET_KEY
    JWT_TOKEN_LOCATION = ["cookies"]
    # Set JWT_COOKIE_SECURE=true once you serve the app over HTTPS (Phase 7).
    JWT_COOKIE_SECURE = os.getenv("JWT_COOKIE_SECURE", "false").lower() == "true"
    # Same host, different port counts as same-site, so Lax works on the LAN.
    JWT_COOKIE_SAMESITE = os.getenv("JWT_COOKIE_SAMESITE", "Lax")
    # Lax already blocks cross-site cookie sending; enable CSRF tokens in Phase 7.
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # ---- Seed admin (created on first boot if no users exist) ----
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")
