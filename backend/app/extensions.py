"""Shared Flask extension singletons."""
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy

# threading async mode keeps the stack simple (no eventlet/gevent monkey-patching)
# and is plenty for a handful of home clients. simple-websocket provides the
# browser<->backend WebSocket transport.
socketio = SocketIO(async_mode="threading")

db = SQLAlchemy()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")
