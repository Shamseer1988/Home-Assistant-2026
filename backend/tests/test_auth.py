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


def test_security_headers(client):
    resp = client.get("/api/health")
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
