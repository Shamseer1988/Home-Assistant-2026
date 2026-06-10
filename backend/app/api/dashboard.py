"""Public dashboard layout endpoints.

Returns dashboards as ordered trees of sections + items, with per-entity
overrides applied. Live values are merged client-side from the Socket.IO stream.
"""
from flask import Blueprint, jsonify

from ..models.dashboard import Dashboard, EntityOverride
from ..models.setting import Setting

bp = Blueprint("dashboard", __name__, url_prefix="/api")


@bp.get("/settings")
def get_settings():
    """Public dashboard preferences (e.g. hidden cameras / persons)."""
    return jsonify({s.key: s.value for s in Setting.query.all()})


@bp.get("/dashboards")
def list_dashboards():
    """All dashboards for the switcher (visible ones; admin sees hidden too)."""
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
            {"id": view.id, "name": view.name, "icon": view.icon, "sort": view.sort, "sections": vsections}
        )

    return {
        "id": dashboard.id,
        "name": dashboard.name,
        "slug": dashboard.slug,
        "views": views,
        "sections": flat,  # flattened, for widgets that read all sections
    }


@bp.get("/dashboard")
def get_dashboard():
    dashboard = Dashboard.query.filter_by(is_default=True).first()
    if not dashboard:
        return jsonify({"id": None, "name": None, "slug": None, "views": [], "sections": []})
    return jsonify(_tree(dashboard))


@bp.get("/dashboard/<slug>")
def get_dashboard_by_slug(slug):
    dashboard = Dashboard.query.filter_by(slug=slug).first()
    if not dashboard:
        return jsonify({"error": "not found"}), 404
    return jsonify(_tree(dashboard))
