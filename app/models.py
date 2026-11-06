from datetime import datetime, timezone

from sqlalchemy import Index, event
from sqlalchemy.engine import Engine
from sqlite3 import Connection as SQLite3Connection
from .extensions import db


# SQLite não aplica chaves estrangeiras (nem ON DELETE CASCADE) por padrão.
@event.listens_for(Engine, "connect")
def _ativar_foreign_keys_sqlite(dbapi_conn, _):
    if isinstance(dbapi_conn, SQLite3Connection):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


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
    votes = db.relationship(
        "Vote", back_populates="autor", cascade="all, delete-orphan"
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
    votes = db.relationship(
        "Vote",
        back_populates="thread",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_threads_board_created", "board_id", "created_at"),
    )

    @property
    def votos(self):
        """Calcula o total de votos dinamicamente (soma dos tipos)."""
        return sum(v.tipo for v in self.votes)

    def to_dict(self, incluir_comentarios=False):
        d = {
            "id": self.id,
            "titulo": self.titulo,
            "texto": self.texto,
            "url": self.url,
            "board": self.board.slug,
            "board_nome": self.board.nome,
            "autor": self.autor.username,
            "user_id": self.user_id,
            "votos": self.votos,
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


# =====================================================
# VOTES
# =====================================================
class Vote(db.Model):
    __tablename__ = "votes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    thread_id = db.Column(
        db.Integer, db.ForeignKey("threads.id", ondelete="CASCADE"), nullable=False
    )
    tipo = db.Column(db.Integer, nullable=False)  # 1 para upvote, -1 para downvote
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    autor = db.relationship("User", back_populates="votes")
    thread = db.relationship("Thread", back_populates="votes")

    __table_args__ = (
        Index("ix_votes_user_thread", "user_id", "thread_id", unique=True),
    )

    def __repr__(self):
        return f"<Vote user={self.user_id} thread={self.thread_id} tipo={self.tipo}>"