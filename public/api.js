<<<<<<< HEAD
const API_BASE = '/api';

const Auth = {
    token: () => localStorage.getItem('token'),
    username: () => localStorage.getItem('username'),
    role: () => localStorage.getItem('role'),
    isLogado: () => !!localStorage.getItem('token'),
    
    headers() {
        const t = this.token();
        return t ? { 'Authorization': `Bearer ${t}` } : {};
    },

    me() {
        const t = this.token();
        const u = this.username();
        const r = this.role();
        if (!t || !u) return null;
        return { id: parseInt(localStorage.getItem('user_id') || '0'), username: u, role: r };
    },

    async login(username, senha) {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, senha })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro no login');
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);
        localStorage.setItem('user_id', data.user_id);
        return data;
    },

    async register(username, senha) {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, senha })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro no registro');
        return await this.login(username, senha);
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        localStorage.removeItem('user_id');
    }
};

const BoardsAPI = {
    async listar() {
        const res = await fetch(`${API_BASE}/boards/`);
        if (!res.ok) throw new Error('Erro ao listar boards');
        return await res.json();
    }
};

const ThreadsAPI = {
    async listar(boardSlug = null) {
        let url = `${API_BASE}/threads/`;
        if (boardSlug) url += `?board=${boardSlug}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Erro ao listar threads');
        return await res.json();
    },

    async obter(id) {
        const res = await fetch(`${API_BASE}/threads/${id}`);
        if (!res.ok) throw new Error('Erro ao obter thread');
        return await res.json();
    },

    async criar(dados) {
        const res = await fetch(`${API_BASE}/threads/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...Auth.headers()
            },
            body: JSON.stringify(dados)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao criar thread');
        return data;
    },

    async editar(id, dados) {
        const res = await fetch(`${API_BASE}/threads/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...Auth.headers()
            },
            body: JSON.stringify(dados)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao editar thread');
        return data;
    },

    async remover(id) {
        const res = await fetch(`${API_BASE}/threads/${id}`, {
            method: 'DELETE',
            headers: { ...Auth.headers() }
        });
        if (!res.ok) throw new Error('Erro ao excluir thread');
        return true;
    },

    async votar(id, tipo) {
        const res = await fetch(`${API_BASE}/threads/${id}/votar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...Auth.headers()
            },
            body: JSON.stringify({ tipo })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao votar');
        return data;
    }
};

const CommentsAPI = {
    async criar(threadId, texto) {
        const res = await fetch(`${API_BASE}/threads/${threadId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...Auth.headers()
            },
            body: JSON.stringify({ texto })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao comentar');
        return data;
    }
=======
// =====================================================
// 4SHE — Camada de API
// =====================================================

const API = "/api";

function getToken()     { return localStorage.getItem("token"); }
function setToken(t)    { localStorage.setItem("token", t); }
function clearToken()   { localStorage.removeItem("token"); }

function getUsuario() {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
}
function setUsuario(u)  { localStorage.setItem("user", JSON.stringify(u)); }
function clearUsuario() { localStorage.removeItem("user"); }

async function req(path, opts = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...(opts.headers || {}),
    };
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;

    const res = await fetch(API + path, {
        method: opts.method || "GET",
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

    let data = {};
    try { data = await res.json(); } catch {}

    if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
    return data;
}

const Auth = {
    async login(username, password) {
        const { token, user } = await req("/auth/login", { method: "POST", body: { username, password } });
        setToken(token); setUsuario(user); return user;
    },
    async register(username, password) {
        const { token, user } = await req("/auth/register", { method: "POST", body: { username, password } });
        setToken(token); setUsuario(user); return user;
    },
    logout()      { clearToken(); clearUsuario(); },
    isLogado()    { return !!getToken(); },
    me()          { return getUsuario(); },
    username()    { return getUsuario()?.username || null; },
};

const BoardsAPI = {
    listar: () => req("/boards/"),
};

const ThreadsAPI = {
    listar: (slug) => req("/threads/" + (slug ? `?board=${encodeURIComponent(slug)}` : "")),
    obter:  (id)   => req("/threads/" + id),
    criar:  (d)    => req("/threads/", { method: "POST", body: d }),
    remover:(id)   => req("/threads/" + id, { method: "DELETE" }),
};

const CommentsAPI = {
    criar: (threadId, texto) =>
        req(`/threads/${threadId}/comments`, { method: "POST", body: { texto } }),
>>>>>>> c558122bc6b81ae580e8cabbac90b26ce81c2769
};