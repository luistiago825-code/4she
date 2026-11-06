from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Thread, Comment, User

comments_bp = Blueprint("comments", __name__)


# -----------------------------------------------------
# GET /api/threads/:thread_id/comments
# -----------------------------------------------------
@comments_bp.route("/<int:thread_id>/comments", methods=["GET"])
def listar(thread_id):
    cs = Comment.query.filter_by(thread_id=thread_id) \
                     .order_by(Comment.created_at.asc()).all()
    return jsonify([c.to_dict() for c in cs])


# -----------------------------------------------------
# POST /api/threads/:thread_id/comments
# -----------------------------------------------------
@comments_bp.route("/<int:thread_id>/comments", methods=["POST"])
@jwt_required()
def criar(thread_id):
    if not Thread.query.get(thread_id):
        return jsonify({"error": "Thread não existe"}), 404

    data = request.get_json() or {}
    texto = (data.get("texto") or "").strip()
    if not texto:
        return jsonify({"error": "Texto obrigatório"}), 400

    uid = int(get_jwt_identity())
    c = Comment(thread_id=thread_id, user_id=uid, texto=texto)
    db.session.add(c)
    db.session.commit()

    return jsonify({"id": c.id}), 201


# -----------------------------------------------------
# DELETE /api/threads/:thread_id/comments/:id
# -----------------------------------------------------
@comments_bp.route("/<int:thread_id>/comments/<int:comment_id>", methods=["DELETE"])
@jwt_required()
def deletar(thread_id, comment_id):
    c = Comment.query.filter_by(id=comment_id, thread_id=thread_id).first()
    if not c:
        return jsonify({"error": "Comentário não encontrado"}), 404

    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if c.user_id != uid and user.role not in ("admin", "moderator"):
        return jsonify({"error": "Sem permissão"}), 403

    db.session.delete(c)
    db.session.commit()
    return jsonify({"ok": True})