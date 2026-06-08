"""Thin Home Assistant REST client.

Used for the initial state snapshot, service calls (turning things on/off),
and config lookups. Live updates come from the WebSocket bridge instead.
"""
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
