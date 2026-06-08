from app.services.importer import compute_layout


def test_groups_by_area_and_filters():
    areas = [{"area_id": "mb", "name": "Master Bedroom"}]
    devices = [{"id": "d1", "area_id": "mb"}]
    entities = [
        {"entity_id": "light.a", "area_id": "mb"},
        {"entity_id": "sensor.t", "device_id": "d1"},  # area via device
        {"entity_id": "switch.diag", "area_id": "mb", "entity_category": "diagnostic"},
        {"entity_id": "light.off", "area_id": "mb", "disabled_by": "user"},
        {"entity_id": "automation.x", "area_id": "mb"},  # domain not allowed
        {"entity_id": "sensor.float"},  # no area -> Unassigned
    ]
    layout = compute_layout(areas, devices, entities)
    names = [n for n, _ in layout]
    assert names[0] == "Master Bedroom"
    assert "Unassigned" in names
    assert dict(layout)["Master Bedroom"] == ["light.a", "sensor.t"]


def test_trailing_sections_last():
    areas = [{"area_id": "o", "name": "Others"}, {"area_id": "k", "name": "Kitchen"}]
    entities = [
        {"entity_id": "light.k", "area_id": "k"},
        {"entity_id": "light.o", "area_id": "o"},
    ]
    layout = compute_layout(areas, [], entities)
    assert [n for n, _ in layout] == ["Kitchen", "Others"]
