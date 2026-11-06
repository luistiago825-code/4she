<<<<<<< HEAD
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
=======
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
>>>>>>> c558122bc6b81ae580e8cabbac90b26ce81c2769
    main()