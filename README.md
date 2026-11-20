
# 🌱 4SHE — Ciência também é coisa de mulher

> idea of how would be a platform for science outreach focused on women, inspired by classic forums and imageboards.

🇧🇷 [Português](#-português) · 🇺🇸 [English](#-english)

---

# 🇧🇷 Português

## 📖 Sobre

O **4SHE** é uma ideia de como seria uma plataforma web comunitária de divulgação científica voltada para mulheres. O projeto resgata a estrutura dos fóruns e imageboards clássicos — boards temáticos, threads independentes e participação por pseudônimos — e a redireciona para um espaço de troca de conhecimento e valorização da participação feminina na ciência.

A ideia central é que **o conteúdo e as discussões sejam o foco principal**, com uma interface visualmente simples, navegação direta e pouca interferência de elementos decorativos.

## ✨ Funcionalidades

- 🧬 **Boards temáticos** (Biologia, Física, Computação, Astronomia, Química, Matemática, Engenharia, Mulheres na Ciência, Neurociência)
- 📝 **Criação de threads** com título, texto e imagem opcional (URL)
- 💬 **Comentários** com autoria e data
- 👤 **Identidade por pseudônimo** com senha protegida por hash
- 🔐 **Autenticação JWT**
- 🔎 **Busca em tempo real** por boards
- 📱 **Interface responsiva** (desktop, tablet, mobile)
- 🗄️ **Persistência em SQLite** com integridade referencial

## 🛠️ Stack

**Backend:** Python 3.11+, Flask 3.1, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Bcrypt, SQLite

**Frontend:** HTML5, CSS3, JavaScript (ES2020+) — sem frameworks, sem build

## 🗂️ Estrutura
```
4she-serve_python/
├── app/
│   ├── __init__.py        # create_app (factory)
│   ├── extensions.py      # db, jwt, bcrypt
│   ├── models.py          # User, Board, Thread, Comment
│   ├── seed.py            # Boards iniciais
│   ├── create_db.py       # Cria tabelas + seed
│   └── routes/
│       ├── auth.py
│       ├── boards.py
│       ├── threads.py
│       └── comments.py
├── data/4she.db           # SQLite (auto-criado)
├── public/
│   ├── index.html
│   ├── style.css
│   ├── api.js
│   └── app.js
├── requirements.txt
└── run.py
```

## 🗄️ Modelo de dados

```
users ──┬── threads ──┬── comments
        │             │
        └── comments ─┘
boards ── threads
```

- 1 usuária → N threads
- 1 board → N threads
- 1 thread → N comentários
- Todas as FKs com `ON DELETE CASCADE`

## 🚀 Como executar

```bash
# 1. Clonar
git clone https://github.com/seu-usuario/4she.git
cd 4she

# 2. Ambiente virtual
python -m venv .venv
.venv\Scripts\activate      # Windows
source .venv/bin/activate   # Linux/Mac

# 3. Dependências
pip install -r requirements.txt

# 4. Banco + boards
python -m app.create_db

# 5. Rodar
python run.py
```

Acesse: **http://localhost:5000**

## 📡 API

A API do 4SHE segue os princípios **REST**: cada recurso (boards, threads, comentários, usuárias) tem sua própria rota, os métodos HTTP indicam a operação (`GET` para leitura, `POST` para criação, `DELETE` para remoção), e toda comunicação usa **JSON** como formato de troca.

**Organização por recurso:**
- `/api/auth/*` — cadastro, login e dados da usuária logada
- `/api/boards` — listagem de boards (somente leitura)
- `/api/threads/*` — CRUD de threads, com filtro opcional por board
- `/api/threads/:id/comments` — comentários aninhados em uma thread

**Autenticação:** as rotas protegidas exigem o header `Authorization: Bearer <token>`, onde `<token>` é o JWT retornado pelo login ou cadastro. Tokens expiram em 30 dias. Rotas públicas (listagem de boards, threads e comentários) não exigem token — qualquer pessoa pode ler.

**Formato de resposta:** sucesso retorna o objeto/lista em JSON com status `200` ou `201`. Erro retorna `{ "error": "mensagem" }` com o status adequado (`400` para validação, `401` para falta de autenticação, `403` para permissão negada, `404` para recurso inexistente).

**Como testar:** qualquer cliente HTTP funciona — `curl` no terminal, Insomnia, Postman, ou o próprio DevTools do navegador (aba Network). Exemplos de uso estão na seção abaixo.

## 🔐 Segurança

- Senhas sempre com hash **bcrypt** (nunca em texto puro)
- Tokens **JWT** com expiração
- Validação de entrada em todas as rotas
- FKs com `ON DELETE CASCADE`

**Antes de produção:** trocar `JWT_SECRET`, ativar HTTPS, restringir CORS, adicionar rate limiting e migrar para PostgreSQL.


# 🇺🇸 English

## 📖 About

**4SHE** is a conceptual project about how would be a community-driven web platform for science outreach aimed at women. The project brings back the structure of classic forums and imageboards — topic-based boards, independent threads, and pseudonymous participation — and redirects it toward a space for knowledge exchange and recognition of women's participation in science.

The core idea is that **content and discussion should be the main focus**, with a visually simple interface, direct navigation, and minimal decorative interference.

## ✨ Features

- 🧬 **Thematic boards** (Biology, Physics, Computer Science, Astronomy, Chemistry, Mathematics, Engineering, Women in Science, Neuroscience)
- 📝 **Thread creation** with title, text, and optional image (URL)
- 💬 **Comments** with author and timestamp
- 👤 **Pseudonymous identity** with password protected by hash
- 🔐 **JWT authentication**
- 🔎 **Real-time board search**
- 📱 **Responsive interface** (desktop, tablet, mobile)
- 🗄️ **SQLite persistence** with referential integrity

## 🛠️ Stack

**Backend:** Python 3.11+, Flask 3.1, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Bcrypt, SQLite

**Frontend:** HTML5, CSS3, JavaScript (ES2020+) — no frameworks, no build step

## 🗂️ Structure

```
4she-serve_python/
├── app/
│   ├── __init__.py        # create_app (factory)
│   ├── extensions.py      # db, jwt, bcrypt
│   ├── models.py          # User, Board, Thread, Comment
│   ├── seed.py            # Initial boards
│   ├── create_db.py       # Create tables + seed
│   └── routes/
│       ├── auth.py
│       ├── boards.py
│       ├── threads.py
│       └── comments.py
├── data/4she.db           # SQLite (auto-created)
├── public/
│   ├── index.html
│   ├── style.css
│   ├── api.js
│   └── app.js
├── requirements.txt
└── run.py
```

## 🗄️ Data model

```
users ──┬── threads ──┬── comments
        │             │
        └── comments ─┘
boards ── threads
```

- 1 user → N threads
- 1 board → N threads
- 1 thread → N comments
- All FKs use `ON DELETE CASCADE`

## 🚀 Getting started

```bash
# 1. Clone
git clone https://github.com/your-username/4she.git
cd 4she

# 2. Virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
source .venv/bin/activate   # Linux/Mac

# 3. Dependencies
pip install -r requirements.txt

# 4. Database + boards
python -m app.create_db

# 5. Run
python run.py
```

Open: **http://localhost:5000**

## 📡 API

The 4SHE API follows **REST** principles: each resource (boards, threads, comments, users) has its own route, HTTP methods indicate the operation (`GET` for reading, `POST` for creating, `DELETE` for removing), and all communication uses **JSON** as the exchange format.

**Organized by resource:**
- `/api/auth/*` — registration, login, and current user data
- `/api/boards` — board listing (read-only)
- `/api/threads/*` — thread CRUD, with optional filter by board
- `/api/threads/:id/comments` — comments nested under a thread

**Authentication:** protected routes require the header `Authorization: Bearer <token>`, where `<token>` is the JWT returned by login or registration. Tokens expire in 30 days. Public routes (listing boards, threads, and comments) don't require a token — anyone can read.

**Response format:** success returns the object/list in JSON with status `200` or `201`. Errors return `{ "error": "message" }` with the appropriate status (`400` for validation, `401` for missing auth, `403` for forbidden, `404` for not found).

**How to test:** any HTTP client works — `curl` in the terminal, Insomnia, Postman, or the browser's DevTools (Network tab). Usage examples are in the section below.
## 🔐 Security

- Passwords always hashed with **bcrypt** (never plain text)
- **JWT** tokens with expiration
- Input validation on all routes
- FKs with `ON DELETE CASCADE`

**Before production:** rotate `JWT_SECRET`, enable HTTPS, restrict CORS, add rate limiting, and migrate to PostgreSQL.
