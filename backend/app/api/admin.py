"""Admin-only endpoints (protected by JWT + admin role).

Phase 2 ships the auth gate and a small overview. Phase 3/4 add the dashboard
layout CRUD (sections, cards, entity assignments, overrides) behind this gate.
"""
from flask import Blueprint, jsonify

from ..models.user import User
from ..services.state_store import store
from ..utils.auth import admin_required

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@bp.get("/overview")
@admin_required
def overview():
    return jsonify(
        {
            "users": User.query.count(),
            "entities": store.count(),
        }
    )
