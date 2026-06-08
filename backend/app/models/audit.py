"""Audit log for admin mutations."""
from datetime import datetime

from ..extensions import db


class AuditLog(db.Model):
    __tablename__ = "audit_log"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer)
    action = db.Column(db.String(80), nullable=False)
    target = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
