from .__init__ import create_app
from .extensions import db
from .seed import seed_boards


def main():
    app = create_app()
    with app.app_context():
        print("🔧 Criando tabelas...")
        db.create_all()
        print("✅ Tabelas criadas.")
        seed_boards()


if __name__ == "__main__":
    main()