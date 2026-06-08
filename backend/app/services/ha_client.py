"""Thin Home Assistant REST client.

Used for the initial state snapshot, service calls (turning things on/off),
config lookups, and sensor history. Live updates come from the WebSocket bridge.
"""
from datetime import datetime, timedelta, timezone

import requests


class HAClient:
    def __init__(self, base_url, token, verify_ssl=True, timeout=10):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.session = requests.Session()
        self.session.verify = verify_ssl
        self.session.headers.update({"Content-Type": "application/json"})
        if token:
            self.session.headers.update({"Authorization": f"Bearer {token}"})

    def _url(self, path):
        return f"{self.base_url}{path}"

    def get_states(self):
        r = self.session.get(self._url("/api/states"), timeout=self.timeout)
        r.raise_for_status()
        return r.json()

    def get_state(self, entity_id):
        r = self.session.get(self._url(f"/api/states/{entity_id}"), timeout=self.timeout)
        r.raise_for_status()
        return r.json()

    def call_service(self, domain, service, data=None):
        r = self.session.post(
            self._url(f"/api/services/{domain}/{service}"),
            json=data or {},
            timeout=self.timeout,
        )
        r.raise_for_status()
        return r.json()

    def get_config(self):
        r = self.session.get(self._url("/api/config"), timeout=self.timeout)
        r.raise_for_status()
        return r.json()

    def get_history(self, entity_id, hours=24):
        start = (
            (datetime.now(timezone.utc) - timedelta(hours=hours))
            .replace(microsecond=0)
            .isoformat()
            .replace("+00:00", "Z")
        )
        r = self.session.get(
            self._url(f"/api/history/period/{start}"),
            params={
                "filter_entity_id": entity_id,
                "minimal_response": "true",
                "no_attributes": "true",
            },
            timeout=self.timeout,
        )
        r.raise_for_status()
        return r.json()

    def get_camera_image(self, entity_id):
        r = self.session.get(self._url(f"/api/camera_proxy/{entity_id}"), timeout=self.timeout)
        r.raise_for_status()
        return r.content, r.headers.get("Content-Type", "image/jpeg")

    def open_camera_stream(self, entity_id):
        """Open the live MJPEG stream (caller must close the response)."""
        r = self.session.get(
            self._url(f"/api/camera_proxy_stream/{entity_id}"),
            stream=True,
            timeout=(10, None),
        )
        r.raise_for_status()
        return r

    def get_image(self, path):
        r = self.session.get(self._url(path), timeout=self.timeout)
        r.raise_for_status()
        return r.content, r.headers.get("Content-Type", "image/jpeg")

    def get_forecast(self, entity_id, forecast_type="daily"):
        r = self.session.post(
            self._url("/api/services/weather/get_forecasts"),
            params={"return_response": "true"},
            json={"entity_id": entity_id, "type": forecast_type},
            timeout=self.timeout,
        )
        r.raise_for_status()
        data = r.json()
        # REST may return the response directly, keyed by entity, or wrapped.
        resp = data
        if isinstance(data, dict):
            if "service_response" in data:
                resp = data["service_response"]
            if isinstance(resp, dict) and entity_id in resp:
                resp = resp[entity_id]
        if isinstance(resp, dict):
            return resp.get("forecast", [])
        return []
