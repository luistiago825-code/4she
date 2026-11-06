import os
from pathlib import Path
from flask import Flask
from .extensions import db, jwt, bcrypt


def create_app():
    app = Flask(__name__)

    # -------------------------------------------------
    # Caminho do banco (absoluto, disco)
    # -------------------------------------------------
    BASE_DIR = Path(__file__).resolve().parent.parent
    DB_PATH = BASE_DIR / "data" / "4she.db"
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH.as_posix()}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv(
        "JWT_SECRET", "dev-secret-nao-use-em-producao"
    )

    # -------------------------------------------------
    # Liga extensões
    # -------------------------------------------------
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # -------------------------------------------------
    # Importa models (registra as tabelas)
    # -------------------------------------------------
    from . import models   # noqa: F401

    # -------------------------------------------------
    # Registra blueprints
    # -------------------------------------------------
    from .routes.auth     import auth_bp
    from .routes.boards   import boards_bp
    from .routes.threads  import threads_bp
    from .routes.comments import comments_bp

    app.register_blueprint(auth_bp,     url_prefix="/api/auth")
    app.register_blueprint(boards_bp,   url_prefix="/api/boards")
    app.register_blueprint(threads_bp,  url_prefix="/api/threads")
    app.register_blueprint(comments_bp, url_prefix="/api/threads")

    # -------------------------------------------------
    # Healthcheck
    # -------------------------------------------------
    @app.route("/api/health")
    def health():
        import time
        return {"ok": True, "ts": time.time()}

    # -------------------------------------------------
    # CORS manual (sem instalar flask-cors)
    # -------------------------------------------------
    @app.after_request
    def add_cors(resp):
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, DELETE, OPTIONS"
        return resp

    @app.route("/api/<path:_>", methods=["OPTIONS"])
    def options_handler(_):
        return "", 204

    # -------------------------------------------------
    # Serve o front-end (public/)
    # -------------------------------------------------
    from flask import send_from_directory
    PUBLIC_DIR = BASE_DIR / "public"
    PUBLIC_DIR.mkdir(exist_ok=True)

    @app.route("/")
    @app.route("/<path:path>")
    def serve_front(path="index.html"):
        # Se não começa com /api e nem é arquivo, devolve index.html (SPA)
        target = PUBLIC_DIR / path
        if target.is_file():
            return send_from_directory(PUBLIC_DIR, path)
        return send_from_directory(PUBLIC_DIR, "index.html")

    return app