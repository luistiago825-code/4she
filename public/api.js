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
};