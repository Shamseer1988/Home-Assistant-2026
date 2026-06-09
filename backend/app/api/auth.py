"""Authentication endpoints (JWT in httpOnly cookies)."""
import secrets

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
)

from ..extensions import db, limiter
from ..models.user import User

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _tokens_for(user: User):
    claims = {"role": user.role, "username": user.username}
    access = create_access_token(identity=str(user.id), additional_claims=claims)
    refresh = create_refresh_token(identity=str(user.id))
    return access, refresh


@bp.post("/login")
@limiter.limit("10 per minute; 50 per hour")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    user = User.query.filter_by(username=username).first()
    authed = False

    # 1) Local users (incl. the seeded break-glass admin).
    if user and user.check_password(password):
        authed = True
    # 2) Home Assistant accounts.
    elif current_app.config.get("AUTH_MODE", "ha") == "ha":
        try:
            if current_app.ha_client.validate_ha_login(username, password):
                authed = True
                if not user:
                    user = User(username=username, role="admin")
                    user.set_password(secrets.token_hex(16))  # HA is the source of truth
                    db.session.add(user)
                    db.session.commit()
        except Exception as e:  # noqa: BLE001
            current_app.logger.warning("HA login validation error: %s", e)

    if not authed or not user:
        return jsonify({"error": "Invalid username or password"}), 401

    access, refresh = _tokens_for(user)
    resp = jsonify({"user": user.to_dict()})
    set_access_cookies(resp, access)
    set_refresh_cookies(resp, refresh)
    return resp


@bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    uid = get_jwt_identity()
    user = User.query.get(int(uid))
    if not user:
        return jsonify({"error": "user not found"}), 404
    access, _ = _tokens_for(user)
    resp = jsonify({"ok": True})
    set_access_cookies(resp, access)
    return resp


@bp.get("/me")
@jwt_required()
def me():
    uid = get_jwt_identity()
    user = User.query.get(int(uid))
    if not user:
        return jsonify({"error": "user not found"}), 404
    return jsonify({"user": user.to_dict()})


@bp.post("/logout")
def logout():
    resp = jsonify({"ok": True})
    unset_jwt_cookies(resp)
    return resp
