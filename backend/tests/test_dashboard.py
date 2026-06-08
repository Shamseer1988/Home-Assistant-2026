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
