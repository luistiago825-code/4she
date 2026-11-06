from .extensions import db, bcrypt
from .models import Board, User

BOARDS = [
    ("biologia",            "Biologia",            "Discussões sobre vida, saúde e meio ambiente",   "♧"),
    ("fisica",              "Física",              "Do átomo ao cosmos",                            "⚛"),
    ("computacao",          "Computação",          "Código, algoritmos e sistemas",                 "▣"),
    ("astronomia",          "Astronomia",          "Estrelas, galáxias e o universo",               "✧"),
    ("quimica",             "Química",             "Elementos, reações e materiais",                "⚗"),
    ("matematica",          "Matemática",          "Números, provas e conjecturas",                 "∑"),
    ("engenharia",          "Engenharia",          "Projetos, materiais e sistemas",                "⚙"),
    ("mulheres-na-ciencia", "Mulheres na Ciência", "Histórias, conquistas e desafios",              "♡"),
    ("neurociencia",        "Neurociência",        "Cérebro, mente e comportamento",                "⊛"),
]


def seed_boards():
    # 1. Popula os boards
    for slug, nome, descricao, icone in BOARDS:
        if not Board.query.filter_by(slug=slug).first():
            db.session.add(Board(
                slug=slug, nome=nome, descricao=descricao, icone=icone
            ))
    
    # 2. Cria o Administrador Permanente se não existir
    admin_user = User.query.filter_by(username="admin").first()
    if not admin_user:
        pw_hash = bcrypt.generate_password_hash("admin123").decode("utf-8")
        admin = User(
            username="admin",
            password_hash=pw_hash,
            role="admin"
        )
        db.session.add(admin)
        print("✅ Usuário administrador permanente criado (@admin).")

    db.session.commit()
    print("✅ Banco populado com sucesso.")