"""Auth helpers / decorators."""
from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request


def admin_required(fn):
    """Require a valid JWT whose role claim is 'admin'."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "admin privileges required"}), 403
        return fn(*args, **kwargs)

    return wrapper
