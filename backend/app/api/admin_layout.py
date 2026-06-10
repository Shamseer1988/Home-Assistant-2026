"""Admin dashboard-builder CRUD (JWT + admin role).

Rooms (sections), tiles (section items), entity placement, reordering, moving,
and per-entity overrides — everything needed to build the dashboard from the UI
without touching YAML.
"""
from flask import Blueprint, abort, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity

from ..extensions import db
from ..models.audit import AuditLog
from ..models.dashboard import Dashboard, EntityOverride, Section, SectionItem, View
from ..models.setting import Setting
from ..services.state_store import store
from ..utils.auth import admin_required

bp = Blueprint("admin_layout", __name__, url_prefix="/api/admin")


# --------------------------------------------------------------------- helpers
def _get_or_404(model, pk):
    obj = db.session.get(model, pk)
    if obj is None:
        abort(404)
    return obj


def _default_dashboard():
    dash = Dashboard.query.filter_by(is_default=True).first()
    if not dash:
        dash = Dashboard(name="Home", slug="home", is_default=True, sort=0)
        db.session.add(dash)
        db.session.commit()
    return dash


def _default_view(dash):
    view = View.query.filter_by(dashboard_id=dash.id).order_by(View.sort).first()
    if view is None:
        view = View(dashboard_id=dash.id, name="Home", sort=0)
        db.session.add(view)
        db.session.commit()
    return view


def _view_dict(v):
    return {"id": v.id, "name": v.name, "icon": v.icon, "sort": v.sort}


def _next_sort(model, **filters):
    current = db.session.query(db.func.max(model.sort)).filter_by(**filters).scalar()
    return (current or 0) + 1


def _audit(action, target=""):
    try:
        uid = int(get_jwt_identity())
    except (TypeError, ValueError):
        uid = None
    db.session.add(AuditLog(user_id=uid, action=action, target=str(target)))


def _name_of(entity_id):
    st = store.get(entity_id) or {}
    return st.get("attributes", {}).get("friendly_name") or entity_id


def _section_dict(s):
    return {
        "id": s.id,
        "name": s.name,
        "icon": s.icon,
        "sort": s.sort,
        "hidden": s.hidden,
        "item_count": len(s.items),
    }


def _item_dict(i):
    return {
        "id": i.id,
        "section_id": i.section_id,
        "type": i.type,
        "entity_id": i.entity_id,
        "label": i.label,
        "icon": i.icon,
        "sort": i.sort,
        "hidden": i.hidden,
        "config": i.config_json,
    }


def _override_dict(o):
    return {
        "entity_id": o.entity_id,
        "friendly_name": o.friendly_name,
        "icon": o.icon,
        "hidden": o.hidden,
    }


# ----------------------------------------------------------------- editable tree
@bp.get("/layout")
@admin_required
def get_layout():
    dashboard_id = request.args.get("dashboard_id", type=int)
    view_id = request.args.get("view_id", type=int)

    dash = db.session.get(Dashboard, dashboard_id) if dashboard_id else None
    if dash is None:
        dash = _default_dashboard()
    _default_view(dash)  # ensure at least one view exists

    view = db.session.get(View, view_id) if view_id else None
    if view is None or view.dashboard_id != dash.id:
        view = View.query.filter_by(dashboard_id=dash.id).order_by(View.sort).first()

    overrides = {o.entity_id: o for o in EntityOverride.query.all()}
    sections = []
    for s in (view.sections if view else []):
        items = []
        for it in s.items:
            ov = overrides.get(it.entity_id)
            items.append(
                {
                    **_item_dict(it),
                    "live_name": _name_of(it.entity_id) if it.entity_id else None,
                    "override": _override_dict(ov) if ov else None,
                }
            )
        sections.append(
            {
                "id": s.id,
                "name": s.name,
                "icon": s.icon,
                "sort": s.sort,
                "hidden": s.hidden,
                "items": items,
            }
        )
    return jsonify(
        {
            "id": dash.id,
            "name": dash.name,
            "view_id": view.id if view else None,
            "views": [_view_dict(v) for v in dash.views],
            "sections": sections,
        }
    )


# --------------------------------------------------------------------- views
@bp.post("/dashboards/<int:dashboard_id>/views")
@admin_required
def create_view(dashboard_id):
    dash = _get_or_404(Dashboard, dashboard_id)
    name = ((request.get_json(silent=True) or {}).get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400
    view = View(dashboard_id=dash.id, name=name, sort=_next_sort(View, dashboard_id=dash.id))
    db.session.add(view)
    _audit("create_view", name)
    db.session.commit()
    return jsonify(_view_dict(view)), 201


@bp.patch("/views/<int:view_id>")
@admin_required
def update_view(view_id):
    view = _get_or_404(View, view_id)
    data = request.get_json(silent=True) or {}
    if "name" in data:
        name = (data["name"] or "").strip()
        if not name:
            return jsonify({"error": "name is required"}), 400
        view.name = name
    if "icon" in data:
        view.icon = data["icon"] or None
    _audit("update_view", view.name)
    db.session.commit()
    return jsonify(_view_dict(view))


@bp.delete("/views/<int:view_id>")
@admin_required
def delete_view(view_id):
    view = _get_or_404(View, view_id)
    if View.query.filter_by(dashboard_id=view.dashboard_id).count() <= 1:
        return jsonify({"error": "a dashboard needs at least one view"}), 400
    _audit("delete_view", view.name)
    # cascade deletes the view's sections (FK ondelete=CASCADE + ORM)
    for s in list(view.sections):
        db.session.delete(s)
    db.session.delete(view)
    db.session.commit()
    return jsonify({"ok": True})


@bp.post("/views/reorder")
@admin_required
def reorder_views():
    order = (request.get_json(silent=True) or {}).get("order") or []
    for index, vid in enumerate(order):
        View.query.filter_by(id=vid).update({"sort": index})
    db.session.commit()
    return jsonify({"ok": True})


# ----------------------------------------------------------------- dashboards
def _slugify(name):
    base = "".join(c if c.isalnum() else "-" for c in name.lower()).strip("-") or "dashboard"
    slug = base
    n = 2
    while Dashboard.query.filter_by(slug=slug).first():
        slug = f"{base}-{n}"
        n += 1
    return slug


def _dashboard_dict(d):
    return {
        "id": d.id,
        "name": d.name,
        "slug": d.slug,
        "is_default": d.is_default,
        "hidden": d.hidden,
        "sort": d.sort,
    }


@bp.get("/dashboards")
@admin_required
def admin_list_dashboards():
    rows = Dashboard.query.order_by(Dashboard.sort, Dashboard.id).all()
    return jsonify([_dashboard_dict(d) for d in rows])


@bp.post("/dashboards")
@admin_required
def create_dashboard():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400
    dash = Dashboard(
        name=name,
        slug=_slugify(name),
        is_default=Dashboard.query.count() == 0,
        sort=_next_sort(Dashboard),
    )
    db.session.add(dash)
    db.session.flush()
    db.session.add(View(dashboard_id=dash.id, name="Home", sort=0))
    _audit("create_dashboard", name)
    db.session.commit()
    return jsonify(_dashboard_dict(dash)), 201


@bp.patch("/dashboards/<int:dashboard_id>")
@admin_required
def update_dashboard(dashboard_id):
    dash = _get_or_404(Dashboard, dashboard_id)
    data = request.get_json(silent=True) or {}
    if "name" in data:
        name = (data["name"] or "").strip()
        if not name:
            return jsonify({"error": "name is required"}), 400
        dash.name = name
    if "hidden" in data:
        dash.hidden = bool(data["hidden"])
    if data.get("is_default"):
        Dashboard.query.update({"is_default": False})
        dash.is_default = True
    _audit("update_dashboard", dash.name)
    db.session.commit()
    return jsonify(_dashboard_dict(dash))


@bp.delete("/dashboards/<int:dashboard_id>")
@admin_required
def delete_dashboard(dashboard_id):
    dash = _get_or_404(Dashboard, dashboard_id)
    if dash.is_default:
        return jsonify({"error": "cannot delete the default dashboard"}), 400
    _audit("delete_dashboard", dash.name)
    db.session.delete(dash)
    db.session.commit()
    return jsonify({"ok": True})


@bp.post("/dashboards/reorder")
@admin_required
def reorder_dashboards():
    order = (request.get_json(silent=True) or {}).get("order") or []
    for index, did in enumerate(order):
        Dashboard.query.filter_by(id=did).update({"sort": index})
    db.session.commit()
    return jsonify({"ok": True})


@bp.get("/entities")
@admin_required
def list_entities():
    """Searchable list of HA entities for the picker."""
    q = (request.args.get("q") or "").lower()
    out = []
    for st in store.all():
        eid = st.get("entity_id")
        if not eid:
            continue
        name = st.get("attributes", {}).get("friendly_name") or eid
        if q and q not in eid.lower() and q not in name.lower():
            continue
        out.append(
            {"entity_id": eid, "name": name, "domain": eid.split(".")[0], "state": st.get("state")}
        )
    out.sort(key=lambda x: x["name"].lower())
    return jsonify(out)


# ------------------------------------------------------------------- sections
@bp.post("/sections")
@admin_required
def create_section():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    view = db.session.get(View, data["view_id"]) if data.get("view_id") else None
    if view is not None:
        dash = view.dashboard
    else:
        dash = (db.session.get(Dashboard, data.get("dashboard_id")) if data.get("dashboard_id") else None) or _default_dashboard()
        view = _default_view(dash)

    section = Section(
        dashboard_id=dash.id,
        view_id=view.id,
        name=name,
        icon=data.get("icon") or None,
        sort=_next_sort(Section, view_id=view.id),
    )
    db.session.add(section)
    _audit("create_section", name)
    db.session.commit()
    return jsonify(_section_dict(section)), 201


@bp.patch("/sections/<int:section_id>")
@admin_required
def update_section(section_id):
    section = _get_or_404(Section, section_id)
    data = request.get_json(silent=True) or {}
    if "name" in data:
        name = (data["name"] or "").strip()
        if not name:
            return jsonify({"error": "name is required"}), 400
        section.name = name
    if "icon" in data:
        section.icon = data["icon"] or None
    if "hidden" in data:
        section.hidden = bool(data["hidden"])
    _audit("update_section", section.name)
    db.session.commit()
    return jsonify(_section_dict(section))


@bp.delete("/sections/<int:section_id>")
@admin_required
def delete_section(section_id):
    section = _get_or_404(Section, section_id)
    _audit("delete_section", section.name)
    db.session.delete(section)
    db.session.commit()
    return jsonify({"ok": True})


@bp.post("/sections/reorder")
@admin_required
def reorder_sections():
    order = (request.get_json(silent=True) or {}).get("order") or []
    for index, sid in enumerate(order):
        Section.query.filter_by(id=sid).update({"sort": index})
    _audit("reorder_sections", ",".join(map(str, order)))
    db.session.commit()
    return jsonify({"ok": True})


# ---------------------------------------------------------------------- items
@bp.post("/sections/<int:section_id>/items")
@admin_required
def add_items(section_id):
    section = _get_or_404(Section, section_id)
    data = request.get_json(silent=True) or {}
    entity_ids = data.get("entity_ids")
    if not entity_ids and data.get("entity_id"):
        entity_ids = [data["entity_id"]]
    entity_ids = [e for e in (entity_ids or []) if e]
    if not entity_ids:
        return jsonify({"error": "entity_id(s) required"}), 400

    sort = _next_sort(SectionItem, section_id=section.id) - 1
    created = []
    for eid in entity_ids:
        sort += 1
        item = SectionItem(section_id=section.id, type="entity", entity_id=eid, sort=sort)
        db.session.add(item)
        created.append(item)
    _audit("add_items", f"{section.name}: {len(created)}")
    db.session.commit()
    return jsonify([_item_dict(i) for i in created]), 201


@bp.post("/sections/<int:section_id>/cards")
@admin_required
def create_card(section_id):
    """Add a typed card (entity, glance, gauge, markdown, iframe, …)."""
    section = _get_or_404(Section, section_id)
    data = request.get_json(silent=True) or {}
    item = SectionItem(
        section_id=section.id,
        type=(data.get("type") or "entity").strip(),
        entity_id=data.get("entity_id") or None,
        label=data.get("label") or None,
        icon=data.get("icon") or None,
        config_json=data.get("config") or None,
        sort=_next_sort(SectionItem, section_id=section.id),
    )
    db.session.add(item)
    _audit("create_card", f"{section.name}:{item.type}")
    db.session.commit()
    return jsonify(_item_dict(item)), 201


@bp.patch("/items/<int:item_id>")
@admin_required
def update_item(item_id):
    item = _get_or_404(SectionItem, item_id)
    data = request.get_json(silent=True) or {}
    if "label" in data:
        item.label = data["label"] or None
    if "icon" in data:
        item.icon = data["icon"] or None
    if "hidden" in data:
        item.hidden = bool(data["hidden"])
    if "config" in data:
        item.config_json = data["config"]
    if "type" in data and data["type"]:
        item.type = data["type"]
    if data.get("section_id"):
        target = _get_or_404(Section, data["section_id"])
        item.section_id = target.id
        item.sort = _next_sort(SectionItem, section_id=target.id)
    _audit("update_item", item.entity_id or item.id)
    db.session.commit()
    return jsonify(_item_dict(item))


@bp.delete("/items/<int:item_id>")
@admin_required
def delete_item(item_id):
    item = _get_or_404(SectionItem, item_id)
    _audit("delete_item", item.entity_id or item.id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({"ok": True})


@bp.post("/sections/<int:section_id>/items/reorder")
@admin_required
def reorder_items(section_id):
    order = (request.get_json(silent=True) or {}).get("order") or []
    for index, iid in enumerate(order):
        SectionItem.query.filter_by(id=iid, section_id=section_id).update({"sort": index})
    db.session.commit()
    return jsonify({"ok": True})


# ------------------------------------------------------------------ overrides
@bp.put("/overrides/<path:entity_id>")
@admin_required
def upsert_override(entity_id):
    data = request.get_json(silent=True) or {}
    ov = db.session.get(EntityOverride, entity_id)
    if not ov:
        ov = EntityOverride(entity_id=entity_id)
        db.session.add(ov)
    if "friendly_name" in data:
        ov.friendly_name = data["friendly_name"] or None
    if "icon" in data:
        ov.icon = data["icon"] or None
    if "hidden" in data:
        ov.hidden = bool(data["hidden"])
    _audit("override", entity_id)
    db.session.commit()
    return jsonify(_override_dict(ov))


@bp.delete("/overrides/<path:entity_id>")
@admin_required
def delete_override(entity_id):
    ov = db.session.get(EntityOverride, entity_id)
    if ov:
        db.session.delete(ov)
        db.session.commit()
    return jsonify({"ok": True})


@bp.put("/settings/<key>")
@admin_required
def put_setting(key):
    value = (request.get_json(silent=True) or {}).get("value")
    setting = db.session.get(Setting, key)
    if not setting:
        setting = Setting(key=key)
        db.session.add(setting)
    setting.value = value
    _audit("setting", key)
    db.session.commit()
    return jsonify({"key": key, "value": value})


@bp.get("/audit")
@admin_required
def get_audit():
    rows = AuditLog.query.order_by(AuditLog.id.desc()).limit(50).all()
    return jsonify(
        [
            {
                "id": r.id,
                "user_id": r.user_id,
                "action": r.action,
                "target": r.target,
                "at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
    )
