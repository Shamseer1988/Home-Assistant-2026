"""Thread-safe in-memory snapshot of all Home Assistant entity states.

The REST snapshot populates it on boot; the WebSocket bridge keeps it fresh.
Read by the HTTP API so clients get a fast, cached view without hammering HA.
"""
import threading


class StateStore:
    def __init__(self):
        self._lock = threading.RLock()
        self._states = {}

    def replace_all(self, states):
        with self._lock:
            self._states = {
                s["entity_id"]: s for s in states if isinstance(s, dict) and "entity_id" in s
            }

    def update(self, entity_id, state):
        with self._lock:
            self._states[entity_id] = state

    def remove(self, entity_id):
        with self._lock:
            self._states.pop(entity_id, None)

    def get(self, entity_id):
        with self._lock:
            return self._states.get(entity_id)

    def all(self):
        with self._lock:
            return list(self._states.values())

    def count(self):
        with self._lock:
            return len(self._states)


# Module-level singleton shared across the app.
store = StateStore()
