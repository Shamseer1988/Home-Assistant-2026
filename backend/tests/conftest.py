import pytest


@pytest.fixture
def app(tmp_path):
    from app import create_app
    from app.config import Config

    class TestConfig(Config):
        TESTING = True
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{tmp_path}/test.db"
        HA_TOKEN = ""
        HA_BASE_URL = "http://127.0.0.1:1"
        HA_WS_URL = "ws://127.0.0.1:1/api/websocket"
        ADMIN_USERNAME = "admin"
        ADMIN_PASSWORD = "testpass"
        RATELIMIT_ENABLED = False
        TRUST_PROXY = False

    return create_app(TestConfig)


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_client(client):
    client.post("/api/auth/login", json={"username": "admin", "password": "testpass"})
    return client
