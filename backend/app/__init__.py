"""Application factory for the SIDRA backend."""
import logging

from flask import Flask
from flask_cors import CORS

from .config import Config
from .extensions import db, jwt, socketio
from .services.ha_client import HAClient
from .services.ha_ws import HAWebSocketBridge
from .services.state_store import store


def _seed_admin(app):
    """Create the initial admin user on first boot if no users exist."""
    from .models.user import User

    if User.query.count() > 0:
        return
    user = User(
        username=app.config["ADMIN_USERNAME"],
        email=app.config["ADMIN_EMAIL"] or None,
        role="admin",
    )
    user.set_password(app.config["ADMIN_PASSWORD"])
    db.session.add(user)
    db.session.commit()
    app.logger.warning(
        "Seeded admin user '%s'. Change ADMIN_PASSWORD in .env and restart.",
        app.config["ADMIN_USERNAME"],
    )


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    # CORS for REST + Socket.IO (browser is on a different origin than the API).
    # supports_credentials lets the httpOnly JWT cookie flow cross-origin; with
    # it, Flask-CORS reflects the request origin instead of sending "*".
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )
    socketio.init_app(app, cors_allowed_origins=app.config["CORS_ORIGINS"])

    # --- Database + auth ---
    db.init_app(app)
    jwt.init_app(app)
    with app.app_context():
        from . import models  # noqa: F401  (registers models on the metadata)

        db.create_all()
        _seed_admin(app)

    # --- Home Assistant REST client ---
    app.ha_client = HAClient(
        app.config["HA_BASE_URL"],
        app.config["HA_TOKEN"],
        verify_ssl=app.config["HA_VERIFY_SSL"],
    )

    # --- Initial state snapshot (best-effort; app still boots if HA is down) ---
    try:
        states = app.ha_client.get_states()
        store.replace_all(states)
        app.logger.info("Loaded %d entities from Home Assistant", len(states))
    except Exception as e:  # noqa: BLE001
        app.logger.warning("Could not load initial states from HA: %s", e)

    # --- Live WebSocket bridge ---
    app.ha_bridge = HAWebSocketBridge(
        ws_url=app.config["HA_WS_URL"],
        token=app.config["HA_TOKEN"],
        socketio=socketio,
        verify_ssl=app.config["HA_VERIFY_SSL"],
        logger=app.logger,
    )

    # --- Blueprints ---
    from .api.admin import bp as admin_bp
    from .api.auth import bp as auth_bp
    from .api.dashboard import bp as dashboard_bp
    from .api.ha import bp as ha_bp
    from .api.health import bp as health_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(ha_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(dashboard_bp)

    # --- Socket.IO handlers (import registers the decorators) ---
    from .sockets import events  # noqa: F401

    # --- Start the live bridge + first-boot room import in the background ---
    if app.config["HA_TOKEN"]:
        socketio.start_background_task(app.ha_bridge.run_forever)
        socketio.start_background_task(_auto_import, app)
    else:
        app.logger.warning("HA_TOKEN not set — live bridge disabled. Configure it in .env")

    return app


def _auto_import(app):
    """Once the HA bridge is connected, seed the default dashboard from areas
    if one doesn't exist yet. Runs in the background so startup never blocks."""
    from .models.dashboard import Dashboard
    from .services.importer import run_import

    bridge = app.ha_bridge
    for _ in range(30):
        if bridge.is_connected():
            break
        socketio.sleep(1)
    if not bridge.is_connected():
        app.logger.warning("Auto-import skipped: HA bridge not connected")
        return

    with app.app_context():
        if Dashboard.query.count() > 0:
            return
        try:
            result = run_import(app)
            app.logger.info("Auto-imported dashboard from HA areas: %s", result)
        except Exception as e:  # noqa: BLE001
            app.logger.warning("Auto-import failed: %s", e)
