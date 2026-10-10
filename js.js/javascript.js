// =====================================================
// 4SHE — Lógica principal (home + boards + busca + username)
// =====================================================

const dad_thread = document.getElementById('thread-list');

let DATE = [];
let BOARD_ATUAL = null;

// -----------------------------------------------------
// USERNAME / PRIMEIRO ACESSO
// -----------------------------------------------------

function getUsername() {
    return localStorage.getItem('username');
}

function pedirUsername() {
    if (getUsername()) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
        <div class="modal-box">
            <h2>Bem-vinda ao 4SHE</h2>
            <p>Escolha um nome de usuário para participar.
               Ele será usado em todas as suas threads e comentários.</p>
            <input type="text" id="input_username" maxlength="20"
                   placeholder="@seu_nome" autofocus>
            <button id="btn_username">ENTRAR</button>
        </div>
    `;
    document.body.appendChild(overlay);

    const input = document.getElementById('input_username');
    const btn = document.getElementById('btn_username');

    function confirmar() {
        let v = input.value.trim().replace(/^@/, '');
        if (v.length < 2) {
            input.style.borderColor = 'red';
            return;
        }
        localStorage.setItem('username', v);
        overlay.remove();
    }

    btn.addEventListener('click', confirmar);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') confirmar();
    });
}

// -----------------------------------------------------
// NAVEGAÇÃO ENTRE BOARDS
// -----------------------------------------------------

function getBoardAtual() {
    const params = new URLSearchParams(window.location.search);
    return params.get('board') || 'Biologia';
}

function irParaBoard(nome) {
    window.location.href = 'boards.html?board=' + encodeURIComponent(nome);
}

// -----------------------------------------------------
// CRIAÇÃO DE THREAD NA LISTA
// -----------------------------------------------------

function cria_thread(x, y) {
    const thread = document.createElement('div');
    thread.classList.add('thread');
    thread.id = y;

    // imagem
    const thread_image = document.createElement('div');
    thread_image.classList.add('thread-image');

    if (x.url && x.url.trim() !== '') {
        const img = document.createElement('img');
        img.src = x.url;
        img.onerror = () => { thread_image.innerText = '🧬'; };
        thread_image.appendChild(img);
    } else {
        thread_image.innerText = '🧬';
    }

    // corpo
    const body = document.createElement('div');

    const h3 = document.createElement('h3');
    h3.innerText = x.titulo;

    const meta = document.createElement('div');
    meta.classList.add('thread-meta');
    meta.innerText = `@${x.autor || 'anônima'} · ${x.board || 'geral'}`;

    body.appendChild(h3);
    body.appendChild(meta);

    // contagem
    const count = document.createElement('div');
    count.classList.add('thread-count');
    const total = (x.comentarios || []).length;
    count.innerText = total + ' respostas';

    thread.appendChild(thread_image);
    thread.appendChild(body);
    thread.appendChild(count);

    thread.addEventListener('click', () => {
        localStorage.setItem('escolhida', y);
        window.location.href = 'thread.html';
    });

    dad_thread.appendChild(thread);
}

// -----------------------------------------------------
// CARREGAR THREADS (com filtro por board)
// -----------------------------------------------------

function carregar(filtroBoard) {
    const dadosStr = localStorage.getItem('threads');
    DATE = dadosStr ? JSON.parse(dadosStr) : [];

    dad_thread.replaceChildren();

    for (let i = 0; i < DATE.length; i++) {
        if (filtroBoard && DATE[i].board !== filtroBoard) continue;
        cria_thread(DATE[i], i);
    }

    if (dad_thread.children.length === 0) {
        const vazio = document.createElement('div');
        vazio.className = 'sem-comentarios';
        vazio.innerText = 'Nenhuma thread ainda. Seja a primeira a publicar!';
        dad_thread.appendChild(vazio);
    }
}

// -----------------------------------------------------
// BUSCA POR BOARDS
// -----------------------------------------------------

function initBusca() {
    const input = document.querySelector('.search');
    if (!input) return;

    input.addEventListener('input', () => {
        const termo = input.value.toLowerCase().trim();

        // filtra cards da home
        document.querySelectorAll('.board-card').forEach(card => {
            const nome = card.querySelector('h3')?.innerText.toLowerCase() || '';
            card.classList.toggle('hidden', termo && !nome.includes(termo));
        });

        // filtra sidebar
        document.querySelectorAll('.board-sidebar button').forEach(btn => {
            const nome = btn.innerText.toLowerCase();
            btn.classList.toggle('hidden', termo && !nome.includes(termo));
        });
    });
}

// -----------------------------------------------------
// LIGA CARDS DA HOME AOS BOARDS
// -----------------------------------------------------

function initCardsHome() {
    document.querySelectorAll('.board-card').forEach(card => {
        const nome = card.querySelector('h3')?.innerText.trim();
        if (!nome) return;
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => irParaBoard(nome));
    });

    // sidebar de boards.html
    document.querySelectorAll('.board-sidebar button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.board-sidebar button')
                .forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            const nome = btn.innerText.replace(/^[^\w]+\s*/, '').trim();
            const ehTodas = nome.toLowerCase() === 'todas';

            // 👇 CORREÇÃO: atualiza o h2
            const h2 = document.querySelector('.board-content h2');
            const desc = document.querySelector('.board-content p');
            if (h2) h2.innerText = ehTodas ? 'Todas as threads' : nome;
            if (desc) desc.innerText = ehTodas
                ? 'Todas as discussões da plataforma.'
                : 'Discussões sobre ' + nome.toLowerCase() + '.';
            carregar(ehTodas ? null : nome);

        });
    });
}

// -----------------------------------------------------
// INIT
// -----------------------------------------------------

function __init() {
    pedirUsername();
    initBusca();
    initCardsHome();

    // Se estamos em boards.html, filtra pela query string
    if (window.location.pathname.includes('boards.html')) {
        const board = getBoardAtual();
        carregar(board);

        // marca a sidebar como selecionada
        document.querySelectorAll('.board-sidebar button').forEach(btn => {
            const nome = btn.innerText.replace(/^[^\w]+\s*/, '').trim();
            if (nome === board) btn.classList.add('selected');
        });
    }
}

__init();