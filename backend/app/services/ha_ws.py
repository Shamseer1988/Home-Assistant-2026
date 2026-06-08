"""Home Assistant WebSocket bridge.

Maintains a persistent WebSocket connection to Home Assistant, streams
`state_changed` events to Socket.IO clients (and into the state store), and
supports request/response commands (e.g. registry lookups for room grouping).

Runs in a background thread started by the app factory.
"""
import json
import ssl
import threading
import time

import websocket  # provided by the websocket-client package

from .state_store import store


class HAWebSocketBridge:
    def __init__(self, ws_url, token, socketio, verify_ssl=True, logger=None):
        self.ws_url = ws_url
        self.token = token
        self.socketio = socketio
        self.verify_ssl = verify_ssl
        self.logger = logger

        self._ws = None
        self._id = 0
        self._id_lock = threading.Lock()
        self._send_lock = threading.Lock()
        self._pending = {}
        self._pending_lock = threading.Lock()
        self._authed = threading.Event()
        self._connected = False
        self._stop = False

    # ------------------------------------------------------------------ public
    def is_connected(self):
        return self._connected and self._authed.is_set()

    def run_forever(self):
        """Connect/listen loop with exponential backoff. Blocks; run in a thread."""
        backoff = 1
        while not self._stop:
            try:
                self._connect_and_listen()
                backoff = 1
            except Exception as e:  # noqa: BLE001 - log and retry
                self._log("warning", "HA WS error: %s", e)
            finally:
                self._connected = False
                self._authed.clear()
                self._fail_pending("connection lost")
            if self._stop:
                break
            self._log("info", "Reconnecting to HA WebSocket in %ss", backoff)
            time.sleep(backoff)
            backoff = min(backoff * 2, 30)

    def command(self, payload, timeout=10):
        """Send a command and block until HA returns its result."""
        if not self._authed.wait(timeout):
            raise RuntimeError("HA WebSocket not connected")
        cmd_id = self._next_id()
        message = dict(payload)
        message["id"] = cmd_id
        event = threading.Event()
        with self._pending_lock:
            self._pending[cmd_id] = {"event": event, "result": None, "error": None}
        self._send(message)
        if not event.wait(timeout):
            with self._pending_lock:
                self._pending.pop(cmd_id, None)
            raise TimeoutError(f"HA command timed out: {payload.get('type')}")
        with self._pending_lock:
            entry = self._pending.pop(cmd_id, None)
        if entry and entry["error"]:
            raise RuntimeError(entry["error"])
        return entry["result"] if entry else None

    def stop(self):
        self._stop = True
        try:
            if self._ws:
                self._ws.close()
        except Exception:  # noqa: BLE001
            pass

    # --------------------------------------------------------------- internals
    def _connect_and_listen(self):
        sslopt = None
        if self.ws_url.startswith("wss://") and not self.verify_ssl:
            sslopt = {"cert_reqs": ssl.CERT_NONE}
        self._log("info", "Connecting to HA WebSocket at %s", self.ws_url)
        self._ws = websocket.create_connection(self.ws_url, sslopt=sslopt, timeout=15)

        # --- auth handshake ---
        hello = json.loads(self._ws.recv())
        if hello.get("type") != "auth_required":
            raise RuntimeError(f"Unexpected first message: {hello.get('type')}")
        self._send({"type": "auth", "access_token": self.token})
        auth_resp = json.loads(self._ws.recv())
        if auth_resp.get("type") != "auth_ok":
            raise RuntimeError(f"HA auth failed: {auth_resp}")

        self._connected = True
        self._authed.set()
        self._log("info", "HA WebSocket authenticated")

        # --- subscribe to live state changes ---
        self._send({"id": self._next_id(), "type": "subscribe_events", "event_type": "state_changed"})

        # --- listen ---
        self._ws.settimeout(None)
        while not self._stop:
            raw = self._ws.recv()
            if not raw:
                raise RuntimeError("HA WebSocket closed")
            self._dispatch(json.loads(raw))

    def _dispatch(self, data):
        mtype = data.get("type")
        if mtype == "event":
            event = data.get("event") or {}
            if event.get("event_type") == "state_changed":
                d = event.get("data") or {}
                entity_id = d.get("entity_id")
                new_state = d.get("new_state")
                if not entity_id:
                    return
                if new_state:
                    store.update(entity_id, new_state)
                    self.socketio.emit("state_changed", {"entity_id": entity_id, "state": new_state})
                else:
                    store.remove(entity_id)
                    self.socketio.emit("state_removed", {"entity_id": entity_id})
        elif mtype == "result":
            self._resolve(data)

    def _resolve(self, data):
        cmd_id = data.get("id")
        with self._pending_lock:
            entry = self._pending.get(cmd_id)
            if not entry:
                return
            if data.get("success", True):
                entry["result"] = data.get("result")
            else:
                entry["error"] = (data.get("error") or {}).get("message", "command failed")
            entry["event"].set()

    def _fail_pending(self, reason):
        with self._pending_lock:
            for entry in self._pending.values():
                entry["error"] = reason
                entry["event"].set()
            self._pending.clear()

    def _send(self, message):
        with self._send_lock:
            if not self._ws:
                raise RuntimeError("WebSocket not connected")
            self._ws.send(json.dumps(message))

    def _next_id(self):
        with self._id_lock:
            self._id += 1
            return self._id

    def _log(self, level, msg, *args):
        if self.logger:
            getattr(self.logger, level)(msg, *args)
