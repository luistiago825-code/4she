from .extensions import db
from .models import Board

BOARDS = [
    ("biologia",             "Biologia",             "Discussões sobre vida, saúde e meio ambiente",   "♧"),
    ("fisica",               "Física",               "Do átomo ao cosmos",                            "⚛"),
    ("computacao",           "Computação",           "Código, algoritmos e sistemas",                  "▣"),
    ("astronomia",           "Astronomia",           "Estrelas, galáxias e o universo",                "✧"),
    ("quimica",              "Química",              "Elementos, reações e materiais",                  "⚗"),
    ("matematica",           "Matemática",           "Números, provas e conjecturas",                   "∑"),
    ("engenharia",           "Engenharia",           "Projetos, materiais e sistemas",                  "⚙"),
    ("mulheres-na-ciencia",  "Mulheres na Ciência",  "Histórias, conquistas e desafios",                "♡"),
    ("neurociencia",         "Neurociência",         "Cérebro, mente e comportamento",                  "⊛"),
]


def seed_boards():
    for slug, nome, descricao, icone in BOARDS:
        if not Board.query.filter_by(slug=slug).first():
            db.session.add(Board(
                slug=slug, nome=nome, descricao=descricao, icone=icone
            ))
    db.session.commit()
    print("✅ Boards populados.")