from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity
)
from app.extensions import db, bcrypt
from app.models import User

auth_bp = Blueprint("auth", __name__)


# -----------------------------------------------------
# POST /api/auth/register
# -----------------------------------------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip().lstrip("@")
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "Username e senha obrigatórios"}), 400
    if len(username) < 2 or len(username) > 20:
        return jsonify({"error": "Username deve ter 2 a 20 caracteres"}), 400
    if len(password) < 4:
        return jsonify({"error": "Senha deve ter no mínimo 4 caracteres"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username já está em uso"}), 409

    hash_ = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(username=username, password_hash=hash_)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


# -----------------------------------------------------
# POST /api/auth/login
# -----------------------------------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip().lstrip("@")
    password = data.get("password") or ""

    user = User.query.filter_by(username=username).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"error": "Usuário ou senha inválidos"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()})


# -----------------------------------------------------
# GET /api/auth/me
# -----------------------------------------------------
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    uid = get_jwt_identity()
    user = User.query.get(int(uid))
    if not user:
        return jsonify({"error": "Usuário não encontrado"}), 404
    return jsonify({"user": user.to_dict()})