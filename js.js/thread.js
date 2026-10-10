// =====================================================
// 4SHE — Renderização da thread + comentários
// =====================================================

function carregar_thread() {
    const index = localStorage.getItem('escolhida');
    const dadosStr = localStorage.getItem('threads');

    const tituloEl = document.getElementById('titulo');
    const textoEl = document.getElementById('texto');
    const imagemEl = document.getElementById('imagem');

    if (!dadosStr || index == null) {
        tituloEl.innerText = 'Thread não encontrada';
        textoEl.innerText = 'Não foi possível carregar essa thread.';
        return;
    }

    const threads = JSON.parse(dadosStr);
    const thread = threads[index];

    if (!thread) {
        tituloEl.innerText = 'Thread não encontrada';
        return;
    }

    tituloEl.innerText = thread.titulo;
    textoEl.innerText = thread.texto;

    if (thread.url && thread.url.trim() !== '') {
        imagemEl.src = thread.url;
        imagemEl.classList.remove('sem-imagem');
    }

    // meta
    const meta = document.createElement('div');
    meta.classList.add('thread-meta');
    meta.style.marginBottom = '20px';
    meta.innerText = `@${thread.autor || 'anônima'} · board: ${thread.board || 'geral'}`;
    tituloEl.insertAdjacentElement('afterend', meta);

    // comentários
    renderizarComentarios(thread);
    initFormComentario(index);
}

// -----------------------------------------------------

function renderizarComentarios(thread) {
    let container = document.getElementById('comentarios');
    if (!container) {
        container = document.createElement('div');
        container.id = 'comentarios';
        container.className = 'comentarios-lista';
        document.getElementById('thread_full')
            .insertAdjacentElement('afterend', container);
    }

    const lista = thread.comentarios || [];
    container.replaceChildren();

    const h3 = document.createElement('h3');
    h3.style.marginBottom = '15px';
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
        autor.innerText = '@' + (c.autor || 'anônima');

        const data = document.createElement('span');
        data.innerText = new Date(c.data).toLocaleString('pt-BR');

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

// -----------------------------------------------------

function initFormComentario(indexThread) {
    let form = document.getElementById('form_comentario');
    if (!form) {
        form = document.createElement('div');
        form.id = 'form_comentario';
        form.className = 'comment-form';
        form.innerHTML = `
            <input type="text" id="input_comentario"
                   placeholder="Escreva um comentário...">
            <button id="btn_comentar">→</button>
        `;
        document.querySelector('main').appendChild(form);
    }

    const input = document.getElementById('input_comentario');
    const btn = document.getElementById('btn_comentar');

    function enviar() {
        const texto = input.value.trim();
        if (!texto) return;

        const threads = JSON.parse(localStorage.getItem('threads')) || [];
        const t = threads[indexThread];
        if (!t) return;

        if (!t.comentarios) t.comentarios = [];

        t.comentarios.push({
            autor: localStorage.getItem('username') || 'anônima',
            texto: texto,
            data: new Date().toISOString()
        });

        localStorage.setItem('threads', JSON.stringify(threads));
        input.value = '';

        renderizarComentarios(t);
    }

    btn.addEventListener('click', enviar);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') enviar();
    });
}

// -----------------------------------------------------

function __init() {
    if (!localStorage.getItem('username')) {
        window.location.href = 'boards.html';
        return;
    }
    carregar_thread();
}

__init();