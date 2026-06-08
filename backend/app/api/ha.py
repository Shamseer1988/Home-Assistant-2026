"""Home Assistant proxy endpoints.

The browser talks only to these routes — never to Home Assistant directly —
so the HA token stays server-side.
"""
from flask import Blueprint, Response, current_app, jsonify, request, stream_with_context

from ..services.state_store import store

bp = Blueprint("ha", __name__, url_prefix="/api/ha")


@bp.get("/states")
def get_states():
    """Cached snapshot of all entity states."""
    return jsonify(store.all())


@bp.get("/states/<path:entity_id>")
def get_state(entity_id):
    state = store.get(entity_id)
    if state is None:
        return jsonify({"error": "entity not found"}), 404
    return jsonify(state)


@bp.post("/services/<domain>/<service>")
def call_service(domain, service):
    """Call a Home Assistant service, e.g. POST /api/ha/services/light/toggle."""
    data = request.get_json(silent=True) or {}
    try:
        result = current_app.ha_client.call_service(domain, service, data)
        return jsonify({"result": result})
    except Exception as e:  # noqa: BLE001
        current_app.logger.exception("Service call %s.%s failed", domain, service)
        return jsonify({"error": str(e)}), 502


@bp.get("/areas")
def get_areas():
    """Area / device / entity registries (used later for room grouping)."""
    bridge = getattr(current_app, "ha_bridge", None)
    if not bridge:
        return jsonify({"error": "bridge unavailable"}), 503
    try:
        return jsonify(
            {
                "areas": bridge.command({"type": "config/area_registry/list"}),
                "devices": bridge.command({"type": "config/device_registry/list"}),
                "entities": bridge.command({"type": "config/entity_registry/list"}),
            }
        )
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 502


@bp.get("/config")
def get_config():
    try:
        return jsonify(current_app.ha_client.get_config())
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 502


@bp.get("/history/<path:entity_id>")
def history(entity_id):
    """Numeric history for sensor sparklines: returns [{t, v}, ...]."""
    hours = request.args.get("hours", default=24, type=int)
    try:
        raw = current_app.ha_client.get_history(entity_id, hours=hours)
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 502

    series = raw[0] if raw else []
    points = []
    for entry in series:
        try:
            value = float(entry.get("state"))
        except (TypeError, ValueError):
            continue
        points.append({"t": entry.get("last_changed") or entry.get("last_updated"), "v": value})
    return jsonify({"entity_id": entity_id, "points": points})


@bp.get("/camera/<path:entity_id>")
def camera(entity_id):
    """Proxy a camera snapshot so the browser never needs the HA token."""
    try:
        content, content_type = current_app.ha_client.get_camera_image(entity_id)
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 502
    return Response(content, content_type=content_type, headers={"Cache-Control": "no-store"})


@bp.get("/forecast/<path:entity_id>")
def forecast(entity_id):
    forecast_type = request.args.get("type", "daily")
    try:
        data = current_app.ha_client.get_forecast(entity_id, forecast_type)
        return jsonify({"entity_id": entity_id, "forecast": data})
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 502


@bp.get("/camera_stream/<path:entity_id>")
def camera_stream(entity_id):
    """Proxy the live MJPEG stream (low-latency, frame-by-frame; no buffering)."""
    try:
        upstream = current_app.ha_client.open_camera_stream(entity_id)
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 502

    content_type = upstream.headers.get("Content-Type", "multipart/x-mixed-replace")

    def generate():
        try:
            for chunk in upstream.iter_content(chunk_size=4096):
                if chunk:
                    yield chunk
        finally:
            upstream.close()

    return Response(
        stream_with_context(generate()),
        content_type=content_type,
        headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"},
    )


@bp.get("/image")
def image_proxy():
    """Proxy an HA image (person avatar, media art). Path must be under /api/."""
    path = request.args.get("path", "")
    if not path.startswith("/api/"):
        return jsonify({"error": "invalid path"}), 400
    try:
        content, content_type = current_app.ha_client.get_image(path)
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 502
    return Response(content, content_type=content_type, headers={"Cache-Control": "max-age=60"})
