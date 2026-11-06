from .__init__ import create_app
from app import create_app
from app.extensions import db
from app import models       # ← ESSA LINHA É OBRIGATÓRIA
from app.seed import seed_boards

def main():
    app = create_app()
    with app.app_context():
        db.create_all()
        seed_boards()

if __name__ == "__main__":
    main()