let BOARD_ATUAL = null;
let THREAD_ATUAL = null;
let BOARDS_MAP = {};

async function irPara(pagina, opts = {}) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById('page-' + pagina);
    if (el) el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (pagina === 'home')      await carregarHomeThreads();
    if (pagina === 'boards') {
        const board = opts.board ?? BOARD_ATUAL;
        BOARD_ATUAL = board;
        await aplicarBoard(board);
    }
    if (pagina === 'publicar') {
        document.querySelector('#page-publicar h2').innerText =
            'Nova Thread' + (BOARD_ATUAL ? ' · ' + BOARD_ATUAL : '');
    }
    if (pagina === 'perfil') {
        carregarPerfil();
    }
}

function getUsername() { return Auth.username(); }

function pedirUsername() {
    if (Auth.isLogado()) { atualizarTagUsername(); return; }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
        <div class="modal-box">
            <h2>Bem-vinda ao 4SHE</h2>
            <p>Entre ou crie uma conta. A senha protege suas contribuições.</p>
            <input type="text"    id="input_username" maxlength="20" placeholder="@seu_nome">
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

const CIENTISTAS_DESTAQUE = [
    {
        nome: "Ada Lovelace (1815–1852)",
        bio: "Matemática e escritora reconhecida por ter escrito o primeiro algoritmo para ser processado por uma máquina analítica, sendo considerada a primeira programadora da história da computação!",
        icone: "💻"
    },
    {
        nome: "Marie Curie (1867–1934)",
        bio: "Física e química pioneira no estudo da radioatividade. Foi a primeira mulher a ganhar um Prêmio Nobel e a única a vencer em duas áreas científicas diferentes (Física e Química).",
        icone: "⚛️"
    },
    {
        nome: "Katherine Johnson (1918–2020)",
        bio: "Matemática cujos cálculos de mecânica orbital para a NASA foram fundamentais para o sucesso dos primeiros voos espaciais tripulados dos Estados Unidos, incluindo a missão à Lua.",
        icone: "🚀"
    },
    {
        nome: "Rosalind Franklin (1920–1958)",
        bio: "Química e cristalógrafa cujas imagens de difração de raios X da molécula de DNA foram cruciais para a descoberta da estrutura em dupla hélice.",
        icone: "🧬"
    }
];

function initCientistaDestaque() {
    const nomeEl = document.getElementById('cientista_nome');
    const bioEl = document.getElementById('cientista_bio');
    const iconeEl = document.getElementById('cientista_icone');
    const btnTrocar = document.getElementById('btn_trocar_cientista');
    
    if (!nomeEl || !bioEl) return;

    function sortear() {
        const index = Math.floor(Math.random() * CIENTISTAS_DESTAQUE.length);
        const cientista = CIENTISTAS_DESTAQUE[index];
        nomeEl.innerText = cientista.nome;
        bioEl.innerText = cientista.bio;
        if (iconeEl) iconeEl.innerText = cientista.icone;
    }

    sortear();
    if (btnTrocar) btnTrocar.onclick = sortear;
}

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
    count.innerText = (t.votos || 0) + ' votos · ' + (t.total_comentarios || 0) + ' respostas';

    el.appendChild(imgBox);
    el.appendChild(body);
    el.appendChild(count);

    el.addEventListener('click', () => abrirThread(t.id));
    return el;
}

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

async function abrirThread(id) {
    THREAD_ATUAL = id;
    try {
        const t = await ThreadsAPI.obter(id);
        const user = Auth.me();

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
        document.getElementById('thread_votos_count').innerText = t.votos || 0;

        document.getElementById('btn_upvote').onclick = async () => {
            if (!Auth.isLogado()) { alert('Faça login para votar.'); return; }
            try {
                const res = await ThreadsAPI.votar(t.id, 1);
                document.getElementById('thread_votos_count').innerText = res.votos;
            } catch (err) { alert(err.message); }
        };

        document.getElementById('btn_downvote').onclick = async () => {
            if (!Auth.isLogado()) { alert('Faça login para votar.'); return; }
            try {
                const res = await ThreadsAPI.votar(t.id, -1);
                document.getElementById('thread_votos_count').innerText = res.votos;
            } catch (err) { alert(err.message); }
        };

        let acoesBox = document.getElementById('thread_admin_actions');
        if (!acoesBox) {
            acoesBox = document.createElement('div');
            acoesBox.id = 'thread_admin_actions';
            acoesBox.style.cssText = 'padding:10px 15px; border-top:1px solid #e8e8e8; display:flex; gap:10px; background:#f7f7f7;';
            document.querySelector('.post').appendChild(acoesBox);
        }
        acoesBox.replaceChildren();

        const ehAdmin = user?.role === 'admin';
        const ehAutor = user?.id === t.user_id;

        if (ehAdmin || ehAutor) {
            const btnEditar = document.createElement('button');
            btnEditar.innerText = '✏️ EDITAR';
            btnEditar.className = 'btn-admin-edit';
            btnEditar.onclick = () => editarThreadPrompt(t);

            const btnDeletar = document.createElement('button');
            btnDeletar.innerText = '🗑️ EXCLUIR';
            btnDeletar.className = 'btn-admin-delete';
            btnDeletar.onclick = () => deletarThreadConfirm(t.id);

            acoesBox.appendChild(btnEditar);
            acoesBox.appendChild(btnDeletar);
            acoesBox.style.display = 'flex';
        } else {
            acoesBox.style.display = 'none';
        }

        renderizarComentarios(t);
        irPara('thread');
    } catch (err) {
        alert('Erro ao abrir thread: ' + err.message);
    }
}

async function deletarThreadConfirm(id) {
    if (!confirm("Tem certeza que deseja excluir esta thread? Essa ação é irreversível.")) return;
    try {
        await ThreadsAPI.remover(id);
        alert("Thread excluída com sucesso!");
        irPara('boards');
    } catch (err) {
        alert("Erro ao excluir thread: " + err.message);
    }
}

async function editarThreadPrompt(t) {
    const novoTitulo = prompt("Novo título:", t.titulo);
    if (novoTitulo === null) return;
    const novoTexto = prompt("Novo texto:", t.texto);
    if (novoTexto === null) return;

    try {
        await ThreadsAPI.editar(t.id, { titulo: novoTitulo, texto: novoTexto });
        alert("Thread atualizada!");
        await abrirThread(t.id);
    } catch (err) {
        alert("Erro ao editar: " + err.message);
    }
}

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

function carregarPerfil() {
    const user = Auth.me();
    if (!user) {
        pedirUsername();
        return;
    }

    const usernameTag = document.getElementById('perfil_username');
    usernameTag.innerText = '@' + user.username;

    const inputAvatar = document.getElementById('input_avatar_url');
    const avatarKey = 'avatar_' + user.username;
    const savedAvatar = localStorage.getItem(avatarKey) || '';
    inputAvatar.value = savedAvatar;

    atualizarVisualAvatar(savedAvatar);
}

function atualizarVisualAvatar(url) {
    const box = document.getElementById('perfil_avatar_box');
    box.replaceChildren();
    if (url && url.trim() !== '') {
        const img = document.createElement('img');
        img.src = url;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.onerror = () => {
            box.innerText = '👤';
        };
        box.appendChild(img);
    } else {
        box.innerText = '👤';
    }
}

function initPerfilEventos() {
    const btnSalvar = document.getElementById('btn_salvar_perfil');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', () => {
            const user = Auth.me();
            if (!user) return;
            const url = document.getElementById('input_avatar_url').value.trim();
            localStorage.setItem('avatar_' + user.username, url);
            atualizarVisualAvatar(url);
            alert('Avatar atualizado com sucesso!');
        });
    }

    const btnSair = document.getElementById('btn_sair_conta');
    if (btnSair) {
        btnSair.addEventListener('click', () => {
            Auth.logout();
            atualizarTagUsername();
            irPara('home');
            pedirUsername();
        });
    }
}

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

function initEventos() {
    document.querySelectorAll('[data-nav]').forEach(el => {
        el.addEventListener('click', () => irPara(el.dataset.nav));
    });

    document.querySelectorAll('.board-card').forEach(card => {
        card.addEventListener('click', () => {
            const board = card.dataset.board;
            BOARD_ATUAL = board;
            irPara('boards', { board });
        });
    });

    document.querySelectorAll('.board-sidebar button').forEach(btn => {
        btn.addEventListener('click', () => {
            const b = btn.dataset.board;
            BOARD_ATUAL = b === '__todas__' ? null : b;
            aplicarBoard(BOARD_ATUAL);
        });
    });

    document.getElementById('btn_comentar').addEventListener('click', enviarComentario);
    document.getElementById('input_comentario').addEventListener('keydown', e => {
        if (e.key === 'Enter') enviarComentario();
    });
}

async function __init() {
    await carregarBoardsMap();
    pedirUsername();
    if (Auth.isLogado()) await carregarHomeThreads();
    initPublicar();
    initEventos();
    initBusca();
    initPerfilEventos();
    initCientistaDestaque();
}

__init();