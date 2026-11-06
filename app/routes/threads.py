from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
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

    if not titulo or not texto or not board_slug:
        return jsonify({"error": "Título, texto e board são obrigatórios"}), 400

    board = Board.query.filter_by(slug=board_slug).first()
    if not board:
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