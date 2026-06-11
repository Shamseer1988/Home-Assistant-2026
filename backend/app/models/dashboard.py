"""Dashboard layout models.

A Dashboard has ordered Sections (rooms / groups); each Section has ordered
SectionItems (entity tiles for now, extensible to rich cards via type +
config_json). EntityOverride holds global per-entity tweaks (name/icon/hidden).

Only the *layout* lives here — live values always come from Home Assistant.
"""
from datetime import datetime

from ..extensions import db


class Dashboard(db.Model):
    __tablename__ = "dashboards"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False)
    is_default = db.Column(db.Boolean, default=False, nullable=False)
    hidden = db.Column(db.Boolean, default=False, nullable=False)
    sort = db.Column(db.Integer, default=0, nullable=False)
    # Access control: "everyone" | "admins" | "users" (allowlist below).
    visibility = db.Column(db.String(20), nullable=False, default="everyone")
    allowed_users_json = db.Column(db.JSON)  # usernames, when visibility == "users"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sections = db.relationship(
        "Section",
        back_populates="dashboard",
        cascade="all, delete-orphan",
        order_by="Section.sort",
    )
    views = db.relationship(
        "View",
        back_populates="dashboard",
        cascade="all, delete-orphan",
        order_by="View.sort",
    )


class View(db.Model):
    """A tab within a dashboard (Home Assistant "view")."""

    __tablename__ = "views"

    id = db.Column(db.Integer, primary_key=True)
    dashboard_id = db.Column(
        db.Integer, db.ForeignKey("dashboards.id", ondelete="CASCADE"), nullable=False
    )
    name = db.Column(db.String(120), nullable=False)
    icon = db.Column(db.String(120))
    sort = db.Column(db.Integer, default=0, nullable=False)
    badges_json = db.Column(db.JSON)  # list of entity_ids shown as chips
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    dashboard = db.relationship("Dashboard", back_populates="views")
    sections = db.relationship(
        "Section",
        back_populates="view",
        order_by="Section.sort",
    )


class Section(db.Model):
    __tablename__ = "sections"

    id = db.Column(db.Integer, primary_key=True)
    dashboard_id = db.Column(
        db.Integer, db.ForeignKey("dashboards.id", ondelete="CASCADE"), nullable=False
    )
    view_id = db.Column(db.Integer, db.ForeignKey("views.id", ondelete="CASCADE"))
    name = db.Column(db.String(120), nullable=False)
    icon = db.Column(db.String(120))
    sort = db.Column(db.Integer, default=0, nullable=False)
    hidden = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    dashboard = db.relationship("Dashboard", back_populates="sections")
    view = db.relationship("View", back_populates="sections")
    items = db.relationship(
        "SectionItem",
        back_populates="section",
        cascade="all, delete-orphan",
        order_by="SectionItem.sort",
    )


class SectionItem(db.Model):
    __tablename__ = "section_items"

    id = db.Column(db.Integer, primary_key=True)
    section_id = db.Column(
        db.Integer, db.ForeignKey("sections.id", ondelete="CASCADE"), nullable=False
    )
    # 'entity' today; future: 'weather', 'gauge', 'media', 'chart', ...
    type = db.Column(db.String(40), default="entity", nullable=False)
    entity_id = db.Column(db.String(255))
    label = db.Column(db.String(255))
    icon = db.Column(db.String(120))
    sort = db.Column(db.Integer, default=0, nullable=False)
    hidden = db.Column(db.Boolean, default=False, nullable=False)
    config_json = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    section = db.relationship("Section", back_populates="items")


class EntityOverride(db.Model):
    __tablename__ = "entity_overrides"

    entity_id = db.Column(db.String(255), primary_key=True)
    friendly_name = db.Column(db.String(255))
    icon = db.Column(db.String(120))
    hidden = db.Column(db.Boolean, default=False, nullable=False)
