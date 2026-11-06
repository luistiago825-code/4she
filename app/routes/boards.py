from flask import Blueprint, jsonify
from app.models import Board

boards_bp = Blueprint("boards", __name__)


# -----------------------------------------------------
# GET /api/boards
# -----------------------------------------------------
@boards_bp.route("/", methods=["GET"])
def listar():
    boards = Board.query.order_by(Board.id).all()
    return jsonify([b.to_dict() for b in boards])