"""Shared Flask extension singletons."""
from flask_socketio import SocketIO

# threading async mode keeps the stack simple (no eventlet/gevent monkey-patching)
# and is plenty for a handful of home clients. simple-websocket provides the
# browser<->backend WebSocket transport.
socketio = SocketIO(async_mode="threading")
