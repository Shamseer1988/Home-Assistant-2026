"""Application factory for the SIDRA backend."""
import logging

from flask import Flask
from flask_cors import CORS

from .config import Config
from .extensions import socketio
from .services.ha_client import HAClient
from .services.ha_ws import HAWebSocketBridge
from .services.state_store import store


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    # CORS for REST + Socket.IO (browser is on a different origin than the API).
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    socketio.init_app(app, cors_allowed_origins=app.config["CORS_ORIGINS"])

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
    from .api.health import bp as health_bp
    from .api.ha import bp as ha_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(ha_bp)

    # --- Socket.IO handlers (import registers the decorators) ---
    from .sockets import events  # noqa: F401

    # --- Start the live bridge in the background ---
    if app.config["HA_TOKEN"]:
        socketio.start_background_task(app.ha_bridge.run_forever)
    else:
        app.logger.warning("HA_TOKEN not set — live bridge disabled. Configure it in .env")

    return app
