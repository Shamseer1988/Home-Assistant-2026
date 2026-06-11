"""Public dashboard layout endpoints.

Returns dashboards as ordered trees of sections + items, with per-entity
overrides applied. Live values are merged client-side from the Socket.IO stream.
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt, jwt_required

from ..models.dashboard import Dashboard, EntityOverride
from ..models.setting import Setting

bp = Blueprint("dashboard", __name__, url_prefix="/api")


def _viewer():
    """(role, username) for the current request, or (None, None) if anonymous."""
    claims = get_jwt() or {}
    return claims.get("role"), claims.get("username")


def _can_see(dash, role, username):
    """Admins and the default/home dashboard are always visible (no lock-out)."""
    if role == "admin" or dash.is_default:
        return True
    vis = (dash.visibility or "everyone")
    if vis == "everyone":
        return True
    if vis == "admins":
        return False
    if vis == "users":
        return username in (dash.allowed_users_json or [])
    return True


@bp.get("/settings")
def get_settings():
    """Public dashboard preferences (e.g. hidden cameras / persons)."""
    return jsonify({s.key: s.value for s in Setting.query.all()})


@bp.get("/dashboards")
@jwt_required(optional=True)
def list_dashboards():
    """Dashboards for the switcher — filtered to ones the viewer may access."""
    role, username = _viewer()
    rows = Dashboard.query.order_by(Dashboard.sort, Dashboard.id).all()
    return jsonify(
        [
            {
                "id": d.id,
                "name": d.name,
                "slug": d.slug,
                "is_default": d.is_default,
                "hidden": d.hidden,
                "sort": d.sort,
            }
            for d in rows
            if _can_see(d, role, username)
        ]
    )


def _section_tree(section, overrides):
    items = []
    for item in section.items:  # ordered by relationship
        override = overrides.get(item.entity_id)
        if item.hidden or (override and override.hidden):
            continue
        items.append(
            {
                "id": item.id,
                "type": item.type,
                "entity_id": item.entity_id,
                "label": item.label or (override.friendly_name if override else None),
                "icon": item.icon or (override.icon if override else None),
                "config": item.config_json,
            }
        )
    return {"id": section.id, "name": section.name, "icon": section.icon, "items": items}


def _tree(dashboard):
    overrides = {o.entity_id: o for o in EntityOverride.query.all()}

    views = []
    flat = []
    for view in dashboard.views:  # ordered by relationship
        vsections = []
        for section in view.sections:  # ordered by relationship
            if section.hidden:
                continue
            tree = _section_tree(section, overrides)
            vsections.append(tree)
            flat.append(tree)
        views.append(
            {
                "id": view.id,
                "name": view.name,
                "icon": view.icon,
                "sort": view.sort,
                "badges": view.badges_json or [],
                "sections": vsections,
            }
        )

    return {
        "id": dashboard.id,
        "name": dashboard.name,
        "slug": dashboard.slug,
        "views": views,
        "sections": flat,  # flattened, for widgets that read all sections
    }


@bp.get("/dashboard")
@jwt_required(optional=True)
def get_dashboard():
    dashboard = Dashboard.query.filter_by(is_default=True).first()
    if not dashboard:
        return jsonify({"id": None, "name": None, "slug": None, "views": [], "sections": []})
    return jsonify(_tree(dashboard))


@bp.get("/dashboard/<slug>")
@jwt_required(optional=True)
def get_dashboard_by_slug(slug):
    dashboard = Dashboard.query.filter_by(slug=slug).first()
    if not dashboard:
        return jsonify({"error": "not found"}), 404
    role, username = _viewer()
    if not _can_see(dashboard, role, username):
        return jsonify({"error": "You don't have access to this dashboard."}), 403
    return jsonify(_tree(dashboard))
