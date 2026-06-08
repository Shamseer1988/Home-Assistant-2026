"""Import Home Assistant areas + entities into a dashboard layout.

`compute_layout` is pure (no DB / network) so it can be unit-tested; `run_import`
fetches the HA registries over the WebSocket bridge and writes the result as the
default dashboard.
"""
from ..extensions import db
from ..models.dashboard import Dashboard, Section, SectionItem
from ..services.state_store import store

# Domains that make sense as room tiles. Everything else is skipped on import;
# the admin can still add others by hand in Phase 4.
ALLOWED_DOMAINS = {
    "light",
    "switch",
    "fan",
    "climate",
    "cover",
    "media_player",
    "lock",
    "vacuum",
    "binary_sensor",
    "sensor",
}

# Tile ordering within a room: controllables first, readings last.
_DOMAIN_PRIORITY = {
    "light": 0,
    "switch": 1,
    "fan": 2,
    "climate": 3,
    "cover": 4,
    "media_player": 5,
    "lock": 6,
    "vacuum": 7,
    "binary_sensor": 8,
    "sensor": 9,
}

# Section names pushed to the end of the dashboard.
_TRAILING = ("others", "other", "unassigned")


def _domain(entity_id: str) -> str:
    return entity_id.split(".")[0]


def _section_sort_key(name):
    if not name:
        return (2, "")
    low = name.lower()
    if low in _TRAILING:
        return (1, low)
    return (0, low)


def compute_layout(areas, devices, entities, name_of=None):
    """Group registry entities into ordered (section_name, [entity_id, ...]).

    - resolves an entity's area from its own area_id, else its device's
    - skips disabled / hidden / config / diagnostic entities
    - keeps only ALLOWED_DOMAINS
    """
    name_of = name_of or (lambda eid: eid)
    area_name = {a.get("area_id"): a.get("name") for a in areas}
    device_area = {d.get("id"): d.get("area_id") for d in devices}

    buckets: dict = {}
    for e in entities:
        if e.get("disabled_by") or e.get("hidden_by"):
            continue
        if e.get("entity_category") in ("config", "diagnostic"):
            continue
        entity_id = e.get("entity_id")
        if not entity_id or _domain(entity_id) not in ALLOWED_DOMAINS:
            continue
        area_id = e.get("area_id") or device_area.get(e.get("device_id"))
        buckets.setdefault(area_id, []).append(entity_id)

    layout = []
    for area_id in sorted(buckets, key=lambda a: _section_sort_key(area_name.get(a))):
        name = area_name.get(area_id) or "Unassigned"
        ids = sorted(
            buckets[area_id],
            key=lambda eid: (
                _DOMAIN_PRIORITY.get(_domain(eid), 99),
                str(name_of(eid)).lower(),
            ),
        )
        layout.append((name, ids))
    return layout


def run_import(app):
    """Fetch registries from HA and (re)build the default dashboard. Requires an
    active app context and a connected HA WebSocket bridge."""
    bridge = app.ha_bridge
    areas = bridge.command({"type": "config/area_registry/list"}) or []
    devices = bridge.command({"type": "config/device_registry/list"}) or []
    entities = bridge.command({"type": "config/entity_registry/list"}) or []

    def name_of(entity_id):
        st = store.get(entity_id) or {}
        return st.get("attributes", {}).get("friendly_name") or entity_id

    layout = compute_layout(areas, devices, entities, name_of)

    # Rebuild the default dashboard from scratch (ORM cascade drops children).
    old = Dashboard.query.filter_by(is_default=True).first()
    if old:
        db.session.delete(old)
        db.session.flush()

    dashboard = Dashboard(name="Home", slug="home", is_default=True, sort=0)
    db.session.add(dashboard)
    db.session.flush()

    item_count = 0
    for section_index, (name, entity_ids) in enumerate(layout):
        section = Section(dashboard_id=dashboard.id, name=name, sort=section_index)
        db.session.add(section)
        db.session.flush()
        for item_index, entity_id in enumerate(entity_ids):
            db.session.add(
                SectionItem(
                    section_id=section.id,
                    type="entity",
                    entity_id=entity_id,
                    sort=item_index,
                )
            )
            item_count += 1

    db.session.commit()
    return {"sections": len(layout), "items": item_count}
