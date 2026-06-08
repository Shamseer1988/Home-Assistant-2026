"""Admin-only endpoints (protected by JWT + admin role).

Phase 2 shipped the auth gate; Phase 3 adds the room importer. Phase 4 will add
the full dashboard-layout CRUD (sections, items, overrides) behind this gate.
"""
from flask import Blueprint, current_app, jsonify

from ..models.dashboard import Dashboard, Section, SectionItem
from ..models.user import User
from ..services.importer import run_import
from ..services.state_store import store
from ..utils.auth import admin_required

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@bp.get("/overview")
@admin_required
def overview():
    dashboard = Dashboard.query.filter_by(is_default=True).first()
    sections = len(dashboard.sections) if dashboard else 0
    items = (
        SectionItem.query.join(Section).filter(Section.dashboard_id == dashboard.id).count()
        if dashboard
        else 0
    )
    return jsonify(
        {
            "users": User.query.count(),
            "entities": store.count(),
            "sections": sections,
            "items": items,
            "ha_connected": bool(
                getattr(current_app, "ha_bridge", None)
                and current_app.ha_bridge.is_connected()
            ),
        }
    )


@bp.post("/import")
@admin_required
def import_from_ha():
    """(Re)build the default dashboard from Home Assistant areas + entities."""
    bridge = getattr(current_app, "ha_bridge", None)
    if not bridge or not bridge.is_connected():
        return jsonify({"error": "Home Assistant bridge is not connected"}), 503
    try:
        result = run_import(current_app._get_current_object())
        return jsonify({"ok": True, **result})
    except Exception as e:  # noqa: BLE001
        current_app.logger.exception("Dashboard import failed")
        return jsonify({"error": str(e)}), 502
