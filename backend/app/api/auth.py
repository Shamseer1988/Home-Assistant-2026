"""Authentication endpoints (JWT in httpOnly cookies)."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
)

from ..models.user import User

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _tokens_for(user: User):
    claims = {"role": user.role, "username": user.username}
    access = create_access_token(identity=str(user.id), additional_claims=claims)
    refresh = create_refresh_token(identity=str(user.id))
    return access, refresh


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
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
