"""Health / status endpoint."""
from flask import Blueprint, current_app, jsonify

from ..services.state_store import store

bp = Blueprint("health", __name__)


@bp.get("/api/health")
def health():
    bridge = getattr(current_app, "ha_bridge", None)
    return jsonify(
        {
            "status": "ok",
            "ha_configured": bool(current_app.config.get("HA_TOKEN")),
            "ha_connected": bool(bridge and bridge.is_connected()),
            "entity_count": store.count(),
        }
    )
