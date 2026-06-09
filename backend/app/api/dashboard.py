"""Public dashboard layout endpoint.

Returns the default dashboard as an ordered tree of sections + items, with
per-entity overrides applied. Live values are merged client-side from the
Socket.IO stream, keyed by entity_id.
"""
from flask import Blueprint, jsonify

from ..models.dashboard import Dashboard, EntityOverride
from ..models.setting import Setting

bp = Blueprint("dashboard", __name__, url_prefix="/api")


@bp.get("/settings")
def get_settings():
    """Public dashboard preferences (e.g. hidden cameras / persons)."""
    return jsonify({s.key: s.value for s in Setting.query.all()})


@bp.get("/dashboard")
def get_dashboard():
    dashboard = Dashboard.query.filter_by(is_default=True).first()
    if not dashboard:
        return jsonify({"id": None, "name": None, "slug": None, "sections": []})

    overrides = {o.entity_id: o for o in EntityOverride.query.all()}

    sections = []
    for section in dashboard.sections:  # ordered by relationship
        if section.hidden:
            continue
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
                }
            )
        sections.append(
            {"id": section.id, "name": section.name, "icon": section.icon, "items": items}
        )

    return jsonify(
        {
            "id": dashboard.id,
            "name": dashboard.name,
            "slug": dashboard.slug,
            "sections": sections,
        }
    )
