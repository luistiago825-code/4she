import os
from pathlib import Path
from flask import Flask
from .extensions import db, jwt, bcrypt

    # --p-----------------------------------------------
    # Caminho do banco

def create_app():
    app = Flask(__name__)

    # -------------------------------------------------
    BASE_DIR = Path(__file__).resolve().parent.parent
    DB_PATH = BASE_DIR / "data" / "4she.db"
    DB_PATH.parent.mkdir(exist_ok=True)
    # -------------------------------------------------
    # Configuração
    # -------------------------------------------------
    ##app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    ##    "DATABASE_URL", f"sqlite:///{DB_PATH}"
    ##)
    # Força o banco a rodar na memória para testar
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv(
        "JWT_SECRET", "dev-secret-nao-use-em-producao"
    )
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False  # ou timedelta(days=30)
    # -------------------------------------------------
    # Liga extensões ao app
    # -------------------------------------------------
    # ... (código anterior de configurações)

    print("👉 PASSO 1: Configurações aplicadas. Ligando extensões...")
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    print("👉 PASSO 2: Extensões ligadas. Carregando models...")
    import models  # noqa: F401

    print("👉 PASSO 3: Models carregados. Criando tabelas...")
    # Força o SQLAlchemy a tentar se conectar e criar o arquivo do banco agora
    with app.app_context():
        db.create_all()
 # -------------------------------------------------
    # Registra blueprints (rotas)
    # -------------------------------------------------
    # from .routes.auth     import auth_bp
    # from .routes.boards   import boards_bp
    # from .routes.threads  import threads_bp
    # from .routes.comments import comments_bp

    # app.register_blueprint(auth_bp,     url_prefix="/api/auth")
    # app.register_blueprint(boards_bp,   url_prefix="/api/boards")
    # app.register_blueprint(threads_bp,  url_prefix="/api/threads")
    # app.register_blueprint(comments_bp, url_prefix="/api/threads")
    # # healthcheck
    print("👉 PASSO 4: Tudo pronto! Registrando rota de teste...")
    @app.route("/api/health")
    def health():
        return {"ok": True, "ts": __import__("time").time()}

    print("👉 PASSO 5: Saindo da função factory!")
    return app
