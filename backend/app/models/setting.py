"""Simple key/value settings (JSON values).

Used for dashboard-wide preferences like which cameras/persons are hidden.
"""
from ..extensions import db


class Setting(db.Model):
    __tablename__ = "settings"

    key = db.Column(db.String(80), primary_key=True)
    value = db.Column(db.JSON)
