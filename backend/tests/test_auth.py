def test_protected_without_login(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/admin/overview").status_code == 401


def test_login_flow(client):
    bad = client.post("/api/auth/login", json={"username": "admin", "password": "nope"})
    assert bad.status_code == 401

    ok = client.post("/api/auth/login", json={"username": "admin", "password": "testpass"})
    assert ok.status_code == 200
    assert ok.get_json()["user"]["username"] == "admin"

    assert client.get("/api/auth/me").status_code == 200
    assert client.get("/api/admin/overview").status_code == 200

    client.post("/api/auth/logout")
    assert client.get("/api/auth/me").status_code == 401


def test_landing_dashboard_preference(auth_client):
    c = auth_client
    # a real dashboard to land on
    c.post("/api/admin/sections", json={"name": "Hall"})  # seeds default dashboard
    d = c.post("/api/admin/dashboards", json={"name": "Cabin"}).get_json()

    # set it as the landing page; /me reflects it
    res = c.put("/api/auth/landing", json={"slug": d["slug"]})
    assert res.status_code == 200
    assert res.get_json()["user"]["landing_slug"] == d["slug"]
    assert c.get("/api/auth/me").get_json()["user"]["landing_slug"] == d["slug"]

    # unknown slug is rejected, current preference unchanged
    assert c.put("/api/auth/landing", json={"slug": "nope"}).status_code == 404

    # clearing returns to the default (home)
    assert c.put("/api/auth/landing", json={"slug": None}).get_json()["user"]["landing_slug"] is None


def test_security_headers(client):
    resp = client.get("/api/health")
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
