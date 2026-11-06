from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
<<<<<<< HEAD
from app.models import Thread, Board, User, Vote

threads_bp = Blueprint("threads", __name__)

@threads_bp.route("/", methods=["GET"])
def listar_threads():
    board_slug = request.args.get("board")
    query = Thread.query.order_by(Thread.created_at.desc())
    if board_slug:
        query = query.join(Board).filter(Board.slug == board_slug)
    threads = query.all()
    return jsonify([t.to_dict() for t in threads]), 200

@threads_bp.route("/<int:thread_id>", methods=["GET"])
def obter_thread(thread_id):
    thread = Thread.query.get_or_404(thread_id)
    return jsonify(thread.to_dict(incluir_comentarios=True)), 200

@threads_bp.route("/", methods=["POST"])
@jwt_required()
def criar_thread():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    titulo = data.get("titulo", "").strip()
    texto = data.get("texto", "").strip()
    url = data.get("url", "").strip()
    board_slug = data.get("board", "").strip()
=======
from app.models import Thread, Board, User

threads_bp = Blueprint("threads", __name__)


# -----------------------------------------------------
# GET /api/threads?board=slug
# -----------------------------------------------------
@threads_bp.route("/", methods=["GET"])
def listar():
    board_slug = request.args.get("board")

    query = Thread.query
    if board_slug:
        board = Board.query.filter_by(slug=board_slug).first()
        if not board:
            return jsonify([])
        query = query.filter_by(board_id=board.id)

    threads = query.order_by(Thread.created_at.desc()).all()
    return jsonify([t.to_dict() for t in threads])


# -----------------------------------------------------
# GET /api/threads/:id
# -----------------------------------------------------
@threads_bp.route("/<int:thread_id>", methods=["GET"])
def obter(thread_id):
    t = Thread.query.get(thread_id)
    if not t:
        return jsonify({"error": "Thread não encontrada"}), 404
    return jsonify(t.to_dict(incluir_comentarios=True))


# -----------------------------------------------------
# POST /api/threads
# -----------------------------------------------------
@threads_bp.route("/", methods=["POST"])
@jwt_required()
def criar():
    data = request.get_json() or {}
    titulo = (data.get("titulo") or "").strip()
    texto = (data.get("texto") or "").strip()
    url = (data.get("url") or "").strip()
    board_slug = (data.get("board") or "").strip()
>>>>>>> c558122bc6b81ae580e8cabbac90b26ce81c2769

    if not titulo or not texto or not board_slug:
        return jsonify({"error": "Título, texto e board são obrigatórios"}), 400

    board = Board.query.filter_by(slug=board_slug).first()
    if not board:
<<<<<<< HEAD
        return jsonify({"error": "Board não encontrado"}), 404

    thread = Thread(
        titulo=titulo, texto=texto, url=url, board_id=board.id, user_id=user_id
    )
    db.session.add(thread)
    db.session.commit()

    return jsonify(thread.to_dict()), 201

@threads_bp.route("/<int:thread_id>", methods=["PUT"])
@jwt_required()
def editar_thread(thread_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    thread = Thread.query.get_or_404(thread_id)

    if thread.user_id != user_id and user.role != "admin":
        return jsonify({"error": "Acesso negado: permissão insuficiente"}), 403

    data = request.get_json() or {}
    thread.titulo = data.get("titulo", thread.titulo).strip()
    thread.texto = data.get("texto", thread.texto).strip()
    thread.url = data.get("url", thread.url).strip()

    db.session.commit()
    return jsonify(thread.to_dict()), 200

@threads_bp.route("/<int:thread_id>", methods=["DELETE"])
@jwt_required()
def deletar_thread(thread_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    thread = Thread.query.get_or_404(thread_id)

    if thread.user_id != user_id and user.role != "admin":
        return jsonify({"error": "Acesso negado: permissão insuficiente"}), 403

    db.session.delete(thread)
    db.session.commit()
    return jsonify({"ok": True}), 200

@threads_bp.route("/<int:thread_id>/votar", methods=["POST"])
@jwt_required()
def votar_thread(thread_id):
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    tipo = data.get("tipo")

    if tipo not in [1, -1]:
        return jsonify({"error": "Tipo de voto inválido"}), 400

    thread = Thread.query.get_or_404(thread_id)
    vote_existente = Vote.query.filter_by(user_id=user_id, thread_id=thread_id).first()

    if vote_existente:
        if vote_existente.tipo == tipo:
            # Se clicar no mesmo botão, remove o voto (toggle)
            db.session.delete(vote_existente)
        else:
            # Se mudou de ideia (ex: de upvote para downvote)
            vote_existente.tipo = tipo
    else:
        # Novo voto
        novo_voto = Vote(user_id=user_id, thread_id=thread_id, tipo=tipo)
        db.session.add(novo_voto)

    db.session.commit()
    return jsonify({"votos": thread.votos}), 200
=======
        return jsonify({"error": "Board inválido"}), 400

    uid = int(get_jwt_identity())
    t = Thread(
        titulo=titulo, texto=texto, url=url or None,
        board_id=board.id, user_id=uid,
    )
    db.session.add(t)
    db.session.commit()

    return jsonify({"id": t.id}), 201


# -----------------------------------------------------
# DELETE /api/threads/:id
# -----------------------------------------------------
@threads_bp.route("/<int:thread_id>", methods=["DELETE"])
@jwt_required()
def deletar(thread_id):
    t = Thread.query.get(thread_id)
    if not t:
        return jsonify({"error": "Thread não encontrada"}), 404

    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if t.user_id != uid and user.role not in ("admin", "moderator"):
        return jsonify({"error": "Sem permissão"}), 403

    db.session.delete(t)
    db.session.commit()
    return jsonify({"ok": True})
>>>>>>> c558122bc6b81ae580e8cabbac90b26ce81c2769
