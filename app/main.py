from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Text, Float, Date, Boolean, Integer, String

from sqlalchemy import event
from sqlalchemy.engine import Engine, URL
from sqlalchemy.exc import IntegrityError
from sqlite3 import Connection as SQLite3Connection



db = SQLAlchemy()

from datetime import datetime, timezone
from sqlalchemy import String, Integer, Text, ForeignKey, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


from datetime import datetime, timezone
from sqlalchemy import String, Integer, Text, ForeignKey, DateTime, Index
from .extensions import db


# =====================================================
# USERS
# =====================================================
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(30), unique=True, index=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="user", nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    threads = db.relationship(
        "Thread", back_populates="autor", cascade="all, delete-orphan"
    )
    comments = db.relationship(
        "Comment", back_populates="autor", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"


# =====================================================
# BOARDS
# =====================================================
class Board(db.Model):
    __tablename__ = "boards"

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(40), unique=True, index=True, nullable=False)
    nome = db.Column(db.String(80), nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    icone = db.Column(db.String(10), nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    threads = db.relationship(
        "Thread", back_populates="board", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "slug": self.slug,
            "nome": self.nome,
            "descricao": self.descricao,
            "icone": self.icone,
            "total_threads": len(self.threads),
        }

    def __repr__(self):
        return f"<Board {self.slug}>"


# =====================================================
# THREADS
# =====================================================
class Thread(db.Model):
    __tablename__ = "threads"

    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    texto = db.Column(db.Text, nullable=False)
    url = db.Column(db.String(500), nullable=True)

    board_id = db.Column(
        db.Integer, db.ForeignKey("boards.id", ondelete="CASCADE"), nullable=False
    )
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    board = db.relationship("Board", back_populates="threads")
    autor = db.relationship("User", back_populates="threads")
    comments = db.relationship(
        "Comment",
        back_populates="thread",
        cascade="all, delete-orphan",
        order_by="Comment.created_at",
    )

    __table_args__ = (
        Index("ix_threads_board_created", "board_id", "created_at"),
    )

    def to_dict(self, incluir_comentarios=False):
        d = {
            "id": self.id,
            "titulo": self.titulo,
            "texto": self.texto,
            "url": self.url,
            "board": self.board.slug,
            "board_nome": self.board.nome,
            "autor": self.autor.username,
            "created_at": self.created_at.isoformat(),
            "total_comentarios": len(self.comments),
        }
        if incluir_comentarios:
            d["comentarios"] = [c.to_dict() for c in self.comments]
        return d

    def __repr__(self):
        return f"<Thread {self.id}: {self.titulo[:30]}>"


# =====================================================
# COMMENTS
# =====================================================
class Comment(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True)
    texto = db.Column(db.Text, nullable=False)

    thread_id = db.Column(
        db.Integer, db.ForeignKey("threads.id", ondelete="CASCADE"), nullable=False
    )
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    thread = db.relationship("Thread", back_populates="comments")
    autor = db.relationship("User", back_populates="comments")

    __table_args__ = (
        Index("ix_comments_thread_created", "thread_id", "created_at"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "texto": self.texto,
            "autor": self.autor.username,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<Comment {self.id} thread={self.thread_id}>"

app = create_app()