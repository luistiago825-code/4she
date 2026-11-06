// =====================================================
// 4SHE — Lógica da UI (consome a API)
// =====================================================

let BOARD_ATUAL = null;
let THREAD_ATUAL = null;
let BOARDS_MAP = {};   // { "Biologia": "biologia", ... }

// -----------------------------------------------------
// NAVEGAÇÃO
// -----------------------------------------------------
async function irPara(pagina, opts = {}) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById('page-' + pagina);
    if (el) el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (pagina === 'home')    await carregarHomeThreads();
    if (pagina === 'boards') {
        const board = opts.board ?? BOARD_ATUAL;
        BOARD_ATUAL = board;
        await aplicarBoard(board);
    }
    if (pagina === 'publicar') {
        document.querySelector('#page-publicar h2').innerText =
            'Nova Thread' + (BOARD_ATUAL ? ' · ' + BOARD_ATUAL : '');
    }
}

// -----------------------------------------------------
// USERNAME / AUTENTICAÇÃO
// -----------------------------------------------------
function getUsername() { return Auth.username(); }

function pedirUsername() {
    if (Auth.isLogado()) { atualizarTagUsername(); return; }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
        <div class="modal-box">
            <h2>Bem-vinda ao 4SHE</h2>
            <p>Entre ou crie uma conta. A senha protege suas contribuições.</p>
            <input type="text"     id="input_username" maxlength="20" placeholder="@seu_nome">
            <input type="password" id="input_senha" placeholder="Senha (mín. 4 caracteres)">
            <button id="btn_entrar">ENTRAR</button>
            <button id="btn_registrar" style="margin-top:8px;background:#fff;">CRIAR CONTA</button>
            <div id="erro_auth" style="color:#d84b4b;font-size:12px;margin-top:10px;"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    const elErro = document.getElementById('erro_auth');

    async function executar(acao) {
        const u = document.getElementById('input_username').value.trim();
        const p = document.getElementById('input_senha').value;
        elErro.innerText = '';
        try {
            if (acao === 'login') await Auth.login(u, p);
            else                  await Auth.register(u, p);
            overlay.remove();
            atualizarTagUsername();
            await carregarBoardsMap();
            await carregarHomeThreads();
            await aplicarBoard(null);
        } catch (err) { elErro.innerText = err.message; }
    }

    document.getElementById('btn_entrar').onclick    = () => executar('login');
    document.getElementById('btn_registrar').onclick = () => executar('register');
}

function atualizarTagUsername() {
    const tag = document.getElementById('username_tag');
    if (tag) tag.innerText = Auth.username() ? '@' + Auth.username() : '';
}

// -----------------------------------------------------
// MAPA DE BOARDS
// -----------------------------------------------------
async function carregarBoardsMap() {
    try {
        const lista = await BoardsAPI.listar();
        BOARDS_MAP = {};
        lista.forEach(b => { BOARDS_MAP[b.nome] = b.slug; });
    } catch (e) { console.error('Erro ao carregar boards:', e); }
}

function nomeParaSlug(nome) {
    return BOARDS_MAP[nome] || nome.toLowerCase()
        .replace(/\s+/g, '-')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// -----------------------------------------------------
// HOME — THREADS RECENTES
// -----------------------------------------------------
async function carregarHomeThreads() {
    const container = document.getElementById('home_threads');
    container.replaceChildren();

    try {
        const lista = await ThreadsAPI.listar();
        const top3 = lista.slice(0, 3);
        if (top3.length === 0) {
            container.innerHTML = '<div class="sem-comentarios">Nenhuma thread ainda.</div>';
            return;
        }
        top3.forEach(t => container.appendChild(criarItemThread(t)));
    } catch (err) {
        container.innerHTML = `<div class="sem-comentarios">Erro: ${err.message}</div>`;
    }
}

// -----------------------------------------------------
// ITEM DE THREAD
// -----------------------------------------------------
function criarItemThread(t) {
    const el = document.createElement('div');
    el.className = 'thread';

    const imgBox = document.createElement('div');
    imgBox.className = 'thread-image';
    if (t.url && t.url.trim() !== '') {
        const img = document.createElement('img');
        img.src = t.url;
        img.onerror = () => { imgBox.innerText = '🧬'; };
        imgBox.appendChild(img);
    } else {
        imgBox.innerText = '🧬';
    }

    const body = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.innerText = t.titulo;
    const meta = document.createElement('div');
    meta.className = 'thread-meta';
    meta.innerText = `@${t.autor} · ${t.board_nome}`;
    body.appendChild(h3);
    body.appendChild(meta);

    const count = document.createElement('div');
    count.className = 'thread-count';
    count.innerText = (t.total_comentarios || 0) + ' respostas';

    el.appendChild(imgBox);
    el.appendChild(body);
    el.appendChild(count);

    el.addEventListener('click', () => abrirThread(t.id));
    return el;
}

// -----------------------------------------------------
// BOARD — LISTA DE THREADS
// -----------------------------------------------------
async function aplicarBoard(boardNome) {
    const titulo = document.getElementById('board_titulo');
    const desc = document.getElementById('board_desc');

    if (!boardNome) {
        titulo.innerText = 'Todas as threads';
        desc.innerText = 'Todas as discussões da plataforma.';
    } else {
        titulo.innerText = boardNome;
        desc.innerText = 'Discussões sobre ' + boardNome.toLowerCase() + '.';
    }

    document.querySelectorAll('.board-sidebar button').forEach(btn => {
        const b = btn.dataset.board;
        btn.classList.toggle('selected',
            (b === '__todas__' && !boardNome) || b === boardNome);
    });

    document.getElementById('link_publicar').onclick = (e) => {
        e.preventDefault();
        irPara('publicar');
    };

    const container = document.getElementById('thread-list');
    container.replaceChildren();

    try {
        const slug = boardNome ? nomeParaSlug(boardNome) : null;
        const lista = await ThreadsAPI.listar(slug);

        if (lista.length === 0) {
            container.innerHTML = '<div class="sem-comentarios">Nenhuma thread neste board ainda. Seja a primeira!</div>';
            return;
        }
        lista.forEach(t => container.appendChild(criarItemThread(t)));
    } catch (err) {
        container.innerHTML = `<div class="sem-comentarios">Erro: ${err.message}</div>`;
    }
}

// -----------------------------------------------------
// ABRIR THREAD
// -----------------------------------------------------
async function abrirThread(id) {
    THREAD_ATUAL = id;
    try {
        const t = await ThreadsAPI.obter(id);

        document.getElementById('thread_titulo').innerText = t.titulo;
        document.getElementById('thread_board_tag').innerText = '#' + t.board;
        document.getElementById('thread_autor').innerText = '@' + t.autor;

        const img = document.getElementById('thread_imagem');
        if (t.url && t.url.trim() !== '') {
            img.src = t.url;
            img.classList.remove('sem-imagem');
        } else {
            img.classList.add('sem-imagem');
            img.src = '';
        }

        document.getElementById('thread_texto').innerText = t.texto;
        renderizarComentarios(t);
        irPara('thread');
    } catch (err) {
        alert('Erro ao abrir thread: ' + err.message);
    }
}

// -----------------------------------------------------
// COMENTÁRIOS
// -----------------------------------------------------
function renderizarComentarios(t) {
    const container = document.getElementById('comentarios_lista');
    container.replaceChildren();

    const lista = t.comentarios || [];
    const h3 = document.createElement('h3');
    h3.innerText = `Comentários (${lista.length})`;
    container.appendChild(h3);

    if (lista.length === 0) {
        const vazio = document.createElement('div');
        vazio.className = 'sem-comentarios';
        vazio.innerText = 'Nenhum comentário ainda. Seja a primeira!';
        container.appendChild(vazio);
        return;
    }

    lista.forEach(c => {
        const div = document.createElement('div');
        div.className = 'comentario';

        const header = document.createElement('div');
        header.className = 'comentario-header';
        const autor = document.createElement('span');
        autor.innerText = '@' + c.autor;
        const data = document.createElement('span');
        data.innerText = new Date(c.created_at).toLocaleString('pt-BR');
        header.appendChild(autor);
        header.appendChild(data);

        const body = document.createElement('div');
        body.className = 'comentario-body';
        body.innerText = c.texto;

        div.appendChild(header);
        div.appendChild(body);
        container.appendChild(div);
    });
}

async function enviarComentario() {
    if (THREAD_ATUAL == null) return;

    const input = document.getElementById('input_comentario');
    const texto = input.value.trim();
    if (!texto) return;

    if (!Auth.isLogado()) { alert('Faça login para comentar.'); return; }

    try {
        await CommentsAPI.criar(THREAD_ATUAL, texto);
        input.value = '';
        const t = await ThreadsAPI.obter(THREAD_ATUAL);
        renderizarComentarios(t);
    } catch (err) {
        alert('Erro ao comentar: ' + err.message);
    }
}

// -----------------------------------------------------
// PUBLICAR THREAD
// -----------------------------------------------------
function initPublicar() {
    const form = document.getElementById('threadForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!Auth.isLogado()) { alert('Faça login para publicar.'); return; }

        const titulo = document.getElementById('titulo').value.trim();
        const url = document.getElementById('url').value.trim();
        const texto = document.getElementById('texto').value.trim();
        if (!titulo || !texto) return;

        const boardNome = BOARD_ATUAL || 'Biologia';
        const boardSlug = nomeParaSlug(boardNome);
        const status = document.getElementById('status');

        try {
            await ThreadsAPI.criar({ titulo, texto, url, board: boardSlug });
            status.style.display = 'block';
            status.style.background = '#d8f1df';
            status.innerText = 'THREAD PUBLICADA EM ' + boardNome.toUpperCase() + '.';
            form.reset();

            setTimeout(() => {
                status.style.display = 'none';
                irPara('boards');
            }, 1200);
        } catch (err) {
            status.style.display = 'block';
            status.style.background = '#ffdada';
            status.innerText = 'ERRO: ' + err.message.toUpperCase();
        }
    });
}

// -----------------------------------------------------
// BUSCA
// -----------------------------------------------------
function initBusca() {
    const input = document.querySelector('.search');
    input.addEventListener('input', () => {
        const termo = input.value.toLowerCase().trim();
        document.querySelectorAll('.board-card').forEach(card => {
            const nome = card.querySelector('h3')?.innerText.toLowerCase() || '';
            card.classList.toggle('hidden', termo && !nome.includes(termo));
        });
        document.querySelectorAll('.board-sidebar button').forEach(btn => {
            const nome = btn.innerText.toLowerCase();
            btn.classList.toggle('hidden', termo && !nome.includes(termo));
        });
    });
}

// -----------------------------------------------------
// EVENTOS GLOBAIS
// -----------------------------------------------------
function initEventos() {
    // Data-nav genérico (logo, top-nav, mobile-nav, botão cancelar, voltar)
    document.querySelectorAll('[data-nav]').forEach(el => {
        el.addEventListener('click', () => irPara(el.dataset.nav));
    });

    // Cards de board na home
    document.querySelectorAll('.board-card').forEach(card => {
        card.addEventListener('click', () => {
            const board = card.dataset.board;
            BOARD_ATUAL = board;
            irPara('boards', { board });
        });
    });

    // Sidebar
    document.querySelectorAll('.board-sidebar button').forEach(btn => {
        btn.addEventListener('click', () => {
            const b = btn.dataset.board;
            BOARD_ATUAL = b === '__todas__' ? null : b;
            aplicarBoard(BOARD_ATUAL);
        });
    });

    // Comentário
    document.getElementById('btn_comentar').addEventListener('click', enviarComentario);
    document.getElementById('input_comentario').addEventListener('keydown', e => {
        if (e.key === 'Enter') enviarComentario();
    });
}

// -----------------------------------------------------
// INIT
// -----------------------------------------------------
async function __init() {
    await carregarBoardsMap();
    pedirUsername();
    if (Auth.isLogado()) await carregarHomeThreads();
    initPublicar();
    initEventos();
    initBusca();
}

__init();