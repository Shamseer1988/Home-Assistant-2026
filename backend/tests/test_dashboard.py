def test_dashboard_crud_and_hidden_override(auth_client):
    c = auth_client

    section_id = c.post("/api/admin/sections", json={"name": "Living"}).get_json()["id"]
    items = c.post(
        f"/api/admin/sections/{section_id}/items",
        json={"entity_ids": ["light.a", "light.b"]},
    ).get_json()
    assert len(items) == 2

    # public dashboard reflects the new room
    pub = c.get("/api/dashboard").get_json()
    living = next(s for s in pub["sections"] if s["name"] == "Living")
    assert len(living["items"]) == 2

    # hiding an entity removes it from the public dashboard
    c.put("/api/admin/overrides/light.a", json={"hidden": True})
    pub = c.get("/api/dashboard").get_json()
    living = next(s for s in pub["sections"] if s["name"] == "Living")
    assert [i["entity_id"] for i in living["items"]] == ["light.b"]

    # deleting the room cascades
    assert c.delete(f"/api/admin/sections/{section_id}").status_code == 200
    assert c.get("/api/admin/layout").get_json()["sections"] == []


def test_reorder_and_move(auth_client):
    c = auth_client
    a = c.post("/api/admin/sections", json={"name": "A"}).get_json()["id"]
    b = c.post("/api/admin/sections", json={"name": "B"}).get_json()["id"]
    items = c.post(f"/api/admin/sections/{a}/items", json={"entity_ids": ["light.x"]}).get_json()
    item_id = items[0]["id"]

    # move the tile from A to B
    c.patch(f"/api/admin/items/{item_id}", json={"section_id": b})
    layout = {s["name"]: s for s in c.get("/api/admin/layout").get_json()["sections"]}
    assert [i["entity_id"] for i in layout["A"]["items"]] == []
    assert [i["entity_id"] for i in layout["B"]["items"]] == ["light.x"]


def test_export_then_import_clones_layout(auth_client):
    c = auth_client
    # creating a room lazily seeds the default dashboard + its view
    sec = c.post("/api/admin/sections", json={"name": "Lab"}).get_json()["id"]
    c.post(f"/api/admin/sections/{sec}/items", json={"entity_ids": ["light.x", "switch.y"]})

    src = next(d for d in c.get("/api/admin/dashboards").get_json() if d["is_default"])

    # export carries the room + items with no database ids
    doc = c.get(f"/api/admin/dashboards/{src['id']}/export").get_json()
    assert doc["sidra_dashboard"] == 1
    lab = next(s for v in doc["views"] for s in v["sections"] if s["name"] == "Lab")
    assert [i["entity_id"] for i in lab["items"]] == ["light.x", "switch.y"]

    # importing makes a brand-new dashboard with the same layout
    doc["override_name"] = "Copy of Home"
    res = c.post("/api/admin/dashboards/import", json=doc)
    assert res.status_code == 201
    new = res.get_json()
    assert new["name"] == "Copy of Home" and new["id"] != src["id"]

    layout = c.get(f"/api/admin/layout?dashboard_id={new['id']}").get_json()
    lab2 = next(s for s in layout["sections"] if s["name"] == "Lab")
    assert [i["entity_id"] for i in lab2["items"]] == ["light.x", "switch.y"]

    # an unrecognised document is rejected
    assert c.post("/api/admin/dashboards/import", json={"foo": 1}).status_code == 400


def test_duplicate_item_clones_into_same_room(auth_client):
    c = auth_client
    sec = c.post("/api/admin/sections", json={"name": "Den"}).get_json()["id"]
    card = c.post(
        f"/api/admin/sections/{sec}/cards",
        json={"type": "gauge", "entity_id": "sensor.temp", "label": "Temp", "config": {"max": 50}},
    ).get_json()

    dup = c.post(f"/api/admin/items/{card['id']}/duplicate")
    assert dup.status_code == 201
    copy = dup.get_json()
    assert copy["id"] != card["id"]
    assert copy["type"] == "gauge"
    assert copy["entity_id"] == "sensor.temp"
    assert copy["config"] == {"max": 50}

    layout = next(s for s in c.get("/api/admin/layout").get_json()["sections"] if s["name"] == "Den")
    assert [i["id"] for i in layout["items"]] == [card["id"], copy["id"]]


def test_view_badges_roundtrip(auth_client):
    c = auth_client
    c.post("/api/admin/sections", json={"name": "Hall"})  # seeds dashboard + view
    layout = c.get("/api/admin/layout").get_json()
    view_id = layout["view_id"]

    # set badges (junk entries are filtered out)
    res = c.patch(
        f"/api/admin/views/{view_id}",
        json={"badges": ["sensor.temp", "  ", 42, "person.sham"]},
    )
    assert res.get_json()["badges"] == ["sensor.temp", "person.sham"]

    # public dashboard carries them per view
    pub = c.get("/api/dashboard").get_json()
    assert pub["views"][0]["badges"] == ["sensor.temp", "person.sham"]

    # export/import keeps badges on the cloned dashboard
    doc = c.get(f"/api/admin/dashboards/{layout['id']}/export").get_json()
    assert doc["views"][0]["badges"] == ["sensor.temp", "person.sham"]
    new = c.post("/api/admin/dashboards/import", json=doc).get_json()
    imported = c.get(f"/api/admin/layout?dashboard_id={new['id']}").get_json()
    assert imported["views"][0]["badges"] == ["sensor.temp", "person.sham"]

    # clearing works
    assert c.patch(f"/api/admin/views/{view_id}", json={"badges": []}).get_json()["badges"] == []


def _make_user(app, username, password, role="user"):
    with app.app_context():
        from app.extensions import db
        from app.models.user import User

        u = User(username=username, role=role)
        u.set_password(password)
        db.session.add(u)
        db.session.commit()


def test_dashboard_access_control(app, auth_client):
    admin = auth_client  # logged in as the seeded admin
    admin.post("/api/admin/sections", json={"name": "Hall"})  # seed default dashboard
    secret = admin.post("/api/admin/dashboards", json={"name": "Secret"}).get_json()
    admin.patch(f"/api/admin/dashboards/{secret['id']}", json={"visibility": "admins"})

    # admin sees everything
    assert secret["slug"] in [d["slug"] for d in admin.get("/api/dashboards").get_json()]
    assert admin.get(f"/api/dashboard/{secret['slug']}").status_code == 200

    # a regular user is filtered out and blocked
    _make_user(app, "bob", "bobpass")
    bob = app.test_client()
    bob.post("/api/auth/login", json={"username": "bob", "password": "bobpass"})
    assert secret["slug"] not in [d["slug"] for d in bob.get("/api/dashboards").get_json()]
    assert bob.get(f"/api/dashboard/{secret['slug']}").status_code == 403
    assert bob.get("/api/dashboard").status_code == 200  # home is always visible

    # allow bob specifically
    admin.patch(
        f"/api/admin/dashboards/{secret['id']}",
        json={"visibility": "users", "allowed_users": ["bob"]},
    )
    assert bob.get(f"/api/dashboard/{secret['slug']}").status_code == 200
    assert secret["slug"] in [d["slug"] for d in bob.get("/api/dashboards").get_json()]


def test_user_role_management(app, auth_client):
    admin = auth_client
    _make_user(app, "carol", "x")

    users = admin.get("/api/admin/users").get_json()
    carol = next(u for u in users if u["username"] == "carol")
    me = next(u for u in users if u["username"] == "admin")

    # promote carol
    assert admin.patch(f"/api/admin/users/{carol['id']}", json={"role": "admin"}).status_code == 200
    # cannot change your own role
    assert admin.patch(f"/api/admin/users/{me['id']}", json={"role": "user"}).status_code == 400
    # invalid role rejected
    assert admin.patch(f"/api/admin/users/{carol['id']}", json={"role": "root"}).status_code == 400
