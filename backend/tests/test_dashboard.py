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
