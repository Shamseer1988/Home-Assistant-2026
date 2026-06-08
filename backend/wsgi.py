"""Entry point for the SIDRA backend.

Run locally with:  python wsgi.py
In Docker the image's CMD runs this same file.
"""
from app import create_app
from app.extensions import socketio

app = create_app()

if __name__ == "__main__":
    socketio.run(
        app,
        host="0.0.0.0",
        port=app.config["PORT"],
        allow_unsafe_werkzeug=True,  # fine for a low-traffic home dashboard
    )
