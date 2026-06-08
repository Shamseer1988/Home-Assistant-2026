"""Socket.IO event handlers.

On connect, push the full current snapshot so a freshly-loaded client renders
immediately; live deltas then arrive as `state_changed` / `state_removed`
emitted by the HA WebSocket bridge.
"""
from flask_socketio import emit

from ..extensions import socketio
from ..services.state_store import store


@socketio.on("connect")
def handle_connect():
    emit("snapshot", store.all())


@socketio.on("disconnect")
def handle_disconnect():
    pass
