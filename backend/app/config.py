"""Environment-driven configuration."""
import os

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
