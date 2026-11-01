const API_URL = "http://localhost:5131/api";

const usuarioAtual = () => {
    try { return JSON.parse(localStorage.getItem("resenhario_usuario") || "null"); }
    catch { return null; }
};

async function api(caminho, opcoes = {}) {
    const resposta = await fetch(`${API_URL}${caminho}`, {
        ...opcoes,
        headers: { "Content-Type": "application/json", ...(opcoes.headers || {}) }
    });
    if (!resposta.ok) {
        let detalhe = "";
        try {
            const json = await resposta.json();
            detalhe = json.mensagem || json.title || JSON.stringify(json);
        } catch {
            detalhe = await resposta.text();
        }
        throw new Error(detalhe || `Erro HTTP ${resposta.status}`);
    }
    if (resposta.status === 204) return null;
    const texto = await resposta.text();
    return texto ? JSON.parse(texto) : null;
}

function renderEstrelas(nota) {
    if (!nota || nota < 1) return '<span style="color:var(--suave)">Sem nota</span>';
    const cheias = Math.min(5, Math.max(1, Math.round(nota)));
    return `<span class="estrelas">${'★'.repeat(cheias)}${'☆'.repeat(5 - cheias)}</span> <small>(${nota}/5)</small>`;
}

document.addEventListener("DOMContentLoaded", () => {
    atualizarNavegacao();
    carregarCatalogo();
    configurarBuscaLivrosGoogle();
    configurarBuscaFilmesTmdb();
    configurarLogin();
    configurarEstante();
    configurarReviews();
    configurarRanking();
});

function atualizarNavegacao() {
    const usuario = usuarioAtual();
    document.querySelectorAll('a[href*="login.html"]').forEach(a => {
        if (usuario) {
            a.textContent = `Olá, ${usuario.nome.split(" ")[0]}`;
        }
    });
}

function criarCapaVazia(titulo) {
    const div = document.createElement("div");
    div.className = "capa-vazia";
    div.textContent = titulo || "Sem imagem";
    return div;
}

function criarCard(item) {
    const card = document.createElement("article");
    card.className = "card-capa";

    if (item.imagem) {
        const img = document.createElement("img");
        img.src = item.imagem;
        img.alt = `Capa de ${item.titulo}`;
        img.loading = "lazy";
        img.onerror = () => img.replaceWith(criarCapaVazia(item.titulo));
        card.appendChild(img);
    } else {
        card.appendChild(criarCapaVazia(item.titulo));
    }

    const info = document.createElement("div");
    info.className = "card-info";

    const titulo = document.createElement("h3");
    titulo.textContent = item.titulo || "Sem título";

    const autor = document.createElement("p");
    autor.textContent = item.autor || "";

    const descricao = document.createElement("p");
    descricao.textContent = item.descricao ? (item.descricao.length > 120 ? item.descricao.slice(0, 117) + "..." : item.descricao) : "";

    info.append(titulo, autor, descricao);

    if (item.botao) {
        const b = document.createElement("button");
        b.textContent = item.botao.texto;
        b.addEventListener("click", item.botao.acao);
        info.appendChild(b);
    }

    card.appendChild(info);
    return card;
}

function exigirLogin() {
    const usuario = usuarioAtual();
    if (!usuario) {
        alert("Entre ou crie uma conta para realizar esta ação.");
        const caminho = location.pathname.toLowerCase();
        location.href = caminho.includes("/paginas/") ? "login.html" : "paginas/login.html";
        return null;
    }
    return usuario;
}

async function adicionarAEstante(ids) {
    const usuario = exigirLogin();
    if (!usuario) return;

    const tipo = ids.idLivros ? "Quero Ler" : "Quero ver";
    try {
        await api("/Estante", {
            method: "POST",
            body: JSON.stringify({
                idUsuario: usuario.idUsuario,
                idLivros: ids.idLivros || null,
                idFilme: ids.idFilme || null,
                idSerie: ids.idSerie || null,
                status: tipo
            })
        });
        alert("Adicionado com sucesso à sua estante virtual!");
    } catch (e) {
        alert(e.message.includes("já está") ? "Esse item já está na sua estante." : `Não foi possível salvar: ${e.message}`);
    }
}

/* =========================================================
   1. CARREGAMENTO INICIAL E CATÁLOGOS
   ========================================================= */

async function carregarCatalogo() {
    const caminho = location.pathname.toLowerCase();
    const inicio = caminho.endsWith("/index.html") || caminho.endsWith("/") || caminho.endsWith("resenhario") || caminho.endsWith("resenhario/");

    if (inicio) {
        await Promise.allSettled([
            carregarFeedSocial(),
            carregarRankingInicio(),
            carregarLivrosEm("inicio-livros", "inicio-mensagem-livros"),
            carregarFilmesEm("inicio-filmes", "inicio-mensagem-filmes")
        ]);
    }

    if (caminho.endsWith("/livros.html")) await carregarLivrosEm("lista-livros", "mensagem-catalogo", true);
    if (caminho.endsWith("/filmes.html")) await carregarFilmesEm("lista-filmes", "mensagem-filmes", true);
}

async function carregarLivrosEm(listaId, mensagemId, permitirEstante = false) {
    const lista = document.getElementById(listaId), msg = document.getElementById(mensagemId);
    if (!lista || !msg) return;

    try {
        const livros = await api("/Livro");
        lista.replaceChildren();
        if (!livros || !livros.length) {
            msg.textContent = "Nenhum livro cadastrado ainda. Use a busca acima para adicionar títulos via Google Books API.";
            return;
        }
        msg.textContent = "";
        livros.forEach(l => lista.appendChild(criarCard({
            titulo: l.titulo,
            autor: l.autor,
            imagem: l.capaUrl,
            descricao: l.sinopse,
            botao: permitirEstante ? {
                texto: "＋ Minha estante",
                acao: () => adicionarAEstante({ idLivros: l.idLivros })
            } : null
        })));
    } catch (e) {
        msg.textContent = "Não foi possível carregar os livros. Verifique se a API backend está em execução.";
        console.error(e);
    }
}

async function carregarFilmesEm(listaId, mensagemId, permitirEstante = false) {
    const lista = document.getElementById(listaId), msg = document.getElementById(mensagemId);
    if (!lista || !msg) return;

    try {
        const filmes = await api("/Filme");
        lista.replaceChildren();
        if (!filmes || !filmes.length) {
            msg.textContent = "Nenhum filme cadastrado ainda. Use a busca acima para pesquisar filmes via TMDB API.";
            return;
        }
        msg.textContent = "";
        filmes.forEach(f => lista.appendChild(criarCard({
            titulo: f.titulo,
            autor: f.diretor ? `Direção: ${f.diretor}` : "Direção não informada",
            imagem: f.posterUrl,
            descricao: f.anoLancamento ? `Lançamento: ${f.anoLancamento}` : "",
            botao: permitirEstante ? {
                texto: "＋ Minha estante",
                acao: () => adicionarAEstante({ idFilme: f.idFilme })
            } : null
        })));
    } catch (e) {
        msg.textContent = "Não foi possível carregar os filmes. Verifique se a API backend está em execução.";
        console.error(e);
    }
}

/* =========================================================
   2. INTEGRAÇÃO GOOGLE BOOKS API (VIA BACKEND C#)
   ========================================================= */

function configurarBuscaLivrosGoogle() {
    const form = document.getElementById("form-busca-livros");
    if (!form) return;

    form.addEventListener("submit", async e => {
        e.preventDefault();
        const termo = document.getElementById("termo-livro").value.trim();
        const msg = document.getElementById("mensagem-busca");
        const area = document.getElementById("resultados-busca");

        area.replaceChildren();
        msg.textContent = "Consultando Google Books API...";

        try {
            const resultados = await api(`/Livro/buscar-externo?termo=${encodeURIComponent(termo)}`);
            if (!resultados || !resultados.length) {
                msg.textContent = "Nenhum livro encontrado na Google Books API para esse termo.";
                return;
            }

            msg.textContent = `${resultados.length} livro(s) encontrado(s) no Google Books. Clique para adicionar ao catálogo:`;
            resultados.forEach(livroExt => {
                const card = criarCard({
                    titulo: livroExt.titulo,
                    autor: livroExt.autor,
                    imagem: livroExt.capaUrl,
                    descricao: livroExt.sinopse || (livroExt.anoPublicacao ? `Publicação: ${livroExt.anoPublicacao}` : "")
                });

                const b = document.createElement("button");
                b.textContent = "Adicionar ao Catálogo";
                b.onclick = async () => {
                    b.disabled = true;
                    b.textContent = "Salvando...";
                    try {
                        await api("/Livro", {
                            method: "POST",
                            body: JSON.stringify({
                                googleBId: livroExt.id,
                                titulo: livroExt.titulo,
                                autor: livroExt.autor,
                                sinopse: livroExt.sinopse,
                                isbn: livroExt.isbn,
                                capaUrl: livroExt.capaUrl
                            })
                        });
                        b.textContent = "Adicionado!";
                        msg.textContent = `“${livroExt.titulo}” foi adicionado ao catálogo com sucesso!`;
                        await carregarLivrosEm("lista-livros", "mensagem-catalogo", true);
                    } catch (err) {
                        b.disabled = false;
                        b.textContent = "Tentar novamente";
                        msg.textContent = `Erro: ${err.message}`;
                    }
                };

                card.querySelector(".card-info").appendChild(b);
                area.appendChild(card);
            });
        } catch (err) {
            console.error(err);
            msg.textContent = `Falha na consulta ao Google Books: ${err.message}`;
        }
    });
}

/* =========================================================
   3. INTEGRAÇÃO TMDB API (VIA BACKEND C#)
   ========================================================= */

function configurarBuscaFilmesTmdb() {
    const form = document.getElementById("form-busca-filmes");
    if (!form) return;

    form.addEventListener("submit", async e => {
        e.preventDefault();
        const termo = document.getElementById("termo-filme").value.trim();
        const msg = document.getElementById("mensagem-busca-filmes");
        const area = document.getElementById("resultados-filmes");

        area.replaceChildren();
        msg.textContent = "Consultando TMDB API...";

        try {
            const resultados = await api(`/Filme/buscar-externo?termo=${encodeURIComponent(termo)}`);
            if (!resultados || !resultados.length) {
                msg.textContent = "Nenhum filme encontrado no TMDB para esse termo.";
                return;
            }

            msg.textContent = `${resultados.length} filme(s) encontrado(s) no TMDB:`;
            resultados.forEach(filmeExt => {
                const card = criarCard({
                    titulo: filmeExt.titulo,
                    autor: filmeExt.diretor ? `Direção: ${filmeExt.diretor}` : "",
                    imagem: filmeExt.posterUrl,
                    descricao: filmeExt.anoLancamento ? `Lançamento: ${filmeExt.anoLancamento}` : ""
                });

                const b = document.createElement("button");
                b.textContent = "Adicionar ao Catálogo";
                b.onclick = async () => {
                    b.disabled = true;
                    b.textContent = "Salvando...";
                    try {
                        await api("/Filme", {
                            method: "POST",
                            body: JSON.stringify({
                                tmdbId: filmeExt.tmdbId,
                                titulo: filmeExt.titulo,
                                diretor: filmeExt.diretor,
                                anoLancamento: filmeExt.anoLancamento,
                                posterUrl: filmeExt.posterUrl
                            })
                        });
                        b.textContent = "Adicionado!";
                        msg.textContent = `“${filmeExt.titulo}” foi salvo no catálogo com sucesso!`;
                        await carregarFilmesEm("lista-filmes", "mensagem-filmes", true);
                    } catch (err) {
                        b.disabled = false;
                        b.textContent = "Tentar novamente";
                        msg.textContent = `Erro: ${err.message}`;
                    }
                };

                card.querySelector(".card-info").appendChild(b);
                area.appendChild(card);
            });
        } catch (err) {
            console.error(err);
            msg.textContent = `Falha na consulta ao TMDB: ${err.message}`;
        }
    });
}

/* =========================================================
   4. ESTANTE VIRTUAL COM STATUS DE LEITURA
   ========================================================= */

async function configurarEstante() {
    const area = document.getElementById("itens-estante");
    const msg = document.getElementById("mensagem-estante");
    if (!area || !msg) return;

    const u = usuarioAtual();
    if (!u) {
        msg.textContent = "Entre na sua conta para visualizar sua estante virtual.";
        return;
    }

    let statusFiltroAtual = "";

    // Configurar botões de filtro rápido
    document.querySelectorAll("#filtros-estante .filtro-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#filtros-estante .filtro-btn").forEach(b => b.classList.remove("ativo"));
            btn.classList.add("ativo");
            statusFiltroAtual = btn.dataset.status || "";
            carregarItensEstante();
        });
    });

    async function carregarItensEstante() {
        msg.textContent = "Carregando sua estante...";
        try {
            const url = statusFiltroAtual
                ? `/Estante?usuarioId=${u.idUsuario}&status=${encodeURIComponent(statusFiltroAtual)}`
                : `/Estante?usuarioId=${u.idUsuario}`;

            const itens = await api(url);
            area.replaceChildren();

            if (!itens || !itens.length) {
                msg.textContent = statusFiltroAtual
                    ? `Nenhum item com status "${statusFiltroAtual}" na sua estante.`
                    : "Sua estante virtual está vazia. Pesquise livros ou filmes e adicione-os com seu status de leitura!";
                return;
            }

            msg.textContent = "";
            itens.forEach(item => {
                const card = criarCard({
                    titulo: item.titulo,
                    autor: item.autor,
                    imagem: item.capaUrl,
                    descricao: `Categoria: ${item.tipo}`
                });

                const info = card.querySelector(".card-info");
                const select = document.createElement("select");

                // Status exigidos no escopo
                const statusDisponiveis = item.tipo === "Livro"
                    ? ["Quero Ler", "Lendo", "Lido", "Abandonado"]
                    : ["Quero ver", "Assistindo", "Assistido", "Abandonado"];

                statusDisponiveis.forEach(s => {
                    const opt = document.createElement("option");
                    opt.value = s;
                    opt.textContent = s;
                    opt.selected = s.toLowerCase() === (item.status || "").toLowerCase();
                    select.appendChild(opt);
                });

                select.onchange = async () => {
                    try {
                        await api(`/Estante/${item.idEstante}?usuarioId=${u.idUsuario}`, {
                            method: "PUT",
                            body: JSON.stringify({ status: select.value })
                        });
                    } catch (e) {
                        alert(`Erro ao atualizar status: ${e.message}`);
                    }
                };

                const remover = document.createElement("button");
                remover.textContent = "Remover da Estante";
                remover.style.background = "#331a1a";
                remover.style.color = "#ff9999";
                remover.style.marginTop = "8px";

                remover.onclick = async () => {
                    if (!confirm(`Remover “${item.titulo}” da sua estante?`)) return;
                    try {
                        await api(`/Estante/${item.idEstante}?usuarioId=${u.idUsuario}`, { method: "DELETE" });
                        card.remove();
                        if (!area.children.length) {
                            msg.textContent = "Sua estante está vazia.";
                        }
                    } catch (e) {
                        alert(e.message);
                    }
                };

                info.append(select, remover);
                area.appendChild(card);
            });
        } catch (e) {
            msg.textContent = `Não foi possível carregar a estante: ${e.message}`;
        }
    }

    carregarItensEstante();
}

/* =========================================================
   5. RESENHAS COMUNITÁRIAS COM AVALIAÇÃO DUPLA (1 A 5)
   ========================================================= */

async function configurarReviews() {
    const form = document.getElementById("form-review");
    const lista = document.getElementById("lista-reviews");
    const msg = document.getElementById("mensagem-reviews");

    // Lógica para alternar o bloco opcional de fidelidade
    const checkFilme = document.getElementById("check-assistiu-filme");
    const blocoFidelidade = document.getElementById("bloco-fidelidade");
    if (checkFilme && blocoFidelidade) {
        checkFilme.addEventListener("change", () => {
            blocoFidelidade.hidden = !checkFilme.checked;
        });
    }

    async function carregarSelects() {
        if (!form) return;
        try {
            const [livros, adaptacoes] = await Promise.all([
                api("/Livro"),
                api("/Adaptacao")
            ]);

            const selLivro = document.getElementById("review-livro");
            if (selLivro) {
                selLivro.replaceChildren();
                const optPadrao = document.createElement("option");
                optPadrao.value = "";
                optPadrao.textContent = "Selecione o livro...";
                selLivro.appendChild(optPadrao);

                livros.forEach(l => {
                    const o = document.createElement("option");
                    o.value = l.idLivros;
                    o.textContent = `${l.titulo} (${l.autor})`;
                    selLivro.appendChild(o);
                });
            }

            const selAdaptacao = document.getElementById("review-adaptacao");
            if (selAdaptacao) {
                selAdaptacao.replaceChildren();
                const optPadrao = document.createElement("option");
                optPadrao.value = "";
                optPadrao.textContent = "Selecione a adaptação cinematográfica (opcional)...";
                selAdaptacao.appendChild(optPadrao);

                adaptacoes.forEach(a => {
                    const o = document.createElement("option");
                    o.value = a.idAdaptacoes;
                    o.textContent = `${a.tituloLivro} ↔ ${a.tituloFilme} (${a.anoLancamentoFilme || 'Filme'})`;
                    selAdaptacao.appendChild(o);
                });
            }
        } catch (err) {
            console.error("Erro ao carregar opções para resenha:", err);
        }
    }

    async function renderReviews() {
        if (!lista) return;
        try {
            const reviews = await api("/Review");
            lista.replaceChildren();

            if (!reviews || !reviews.length) {
                lista.textContent = "Ainda não há resenhas publicadas. Seja a primeira pessoa a compartilhar sua crítica!";
                return;
            }

            reviews.forEach(r => {
                const card = document.createElement("article");
                card.className = "review-card-dupla";

                const dataFmt = r.dataCriacao ? new Date(r.dataCriacao).toLocaleDateString("pt-BR") : "";

                card.innerHTML = `
                    <div class="review-cabecalho">
                        <div>
                            <span class="review-usuario">${r.nomeUsuario || "Leitor"}</span>
                            <span style="color:var(--suave); font-size:13px;"> avaliou </span>
                            <strong style="color:var(--texto);">${r.tituloLivro || "Obra"}</strong>
                            ${r.tituloFilme ? `<span style="color:var(--suave); font-size:13px;"> (Filme: ${r.tituloFilme})</span>` : ""}
                        </div>
                        <div class="review-notas-badges">
                            <span class="badge-nota">Obra: ${renderEstrelas(r.notaLivro)}</span>
                            ${r.assistiuFilme && r.notaFidelidade ? `<span class="badge-nota destaque-fidelidade">Fidelidade: ${renderEstrelas(r.notaFidelidade)}</span>` : ""}
                        </div>
                    </div>
                    <p>${r.comentario || ""}</p>
                    <div class="review-rodape">
                        <span>${r.assistiuFilme ? "✓ Assistiu ao filme e leu o livro" : "Lido apenas o livro"}</span>
                        <span>${dataFmt}</span>
                    </div>
                `;

                lista.appendChild(card);
            });
        } catch (e) {
            lista.textContent = "Não foi possível carregar as resenhas.";
            console.error(e);
        }
    }

    if (form) {
        await carregarSelects();

        form.addEventListener("submit", async e => {
            e.preventDefault();
            const u = exigirLogin();
            if (!u) return;

            const idLivro = Number(document.getElementById("review-livro").value);
            const notaLivroInput = document.querySelector('input[name="notaLivro"]:checked');
            const notaLivro = notaLivroInput ? Number(notaLivroInput.value) : null;
            const comentario = document.getElementById("review-comentario").value.trim();

            const assistiuFilme = checkFilme ? checkFilme.checked : false;
            let idAdaptacao = null;
            let notaFidelidade = null;

            if (assistiuFilme) {
                const idAdaptacaoVal = document.getElementById("review-adaptacao")?.value;
                if (idAdaptacaoVal) idAdaptacao = Number(idAdaptacaoVal);

                const notaFidInput = document.querySelector('input[name="notaFidelidade"]:checked');
                if (notaFidInput) notaFidelidade = Number(notaFidInput.value);
            }

            if (!notaLivro || notaLivro < 1 || notaLivro > 5) {
                msg.textContent = "Por favor, atribua de 1 a 5 estrelas para a obra.";
                return;
            }

            msg.textContent = "Publicando resenha...";
            try {
                await api("/Review", {
                    method: "POST",
                    body: JSON.stringify({
                        idUsuario: u.idUsuario,
                        idLivro: idLivro || null,
                        idAdaptacao: idAdaptacao,
                        notaLivro: notaLivro,
                        notaFidelidade: notaFidelidade,
                        assistiuFilme: assistiuFilme,
                        comentario: comentario
                    })
                });

                form.reset();
                if (blocoFidelidade) blocoFidelidade.hidden = true;
                msg.textContent = "Sua resenha foi publicada com sucesso!";
                await renderReviews();
            } catch (err) {
                msg.textContent = `Erro ao publicar: ${err.message}`;
            }
        });
    }

    await renderReviews();
}

/* =========================================================
   6. RANKING DE ADAPTAÇÕES & VÍNCULO MULTIMÍDIA
   ========================================================= */

async function configurarRanking() {
    const areaRanking = document.getElementById("lista-ranking");
    const msg = document.getElementById("mensagem-ranking");
    const formVinculo = document.getElementById("form-vincular-adaptacao");

    if (formVinculo) {
        try {
            const [livros, filmes] = await Promise.all([api("/Livro"), api("/Filme")]);
            const selL = document.getElementById("select-vinculo-livro");
            const selF = document.getElementById("select-vinculo-filme");

            if (selL) {
                selL.replaceChildren();
                livros.forEach(l => {
                    const opt = document.createElement("option");
                    opt.value = l.idLivros;
                    opt.textContent = `${l.titulo} — ${l.autor}`;
                    selL.appendChild(opt);
                });
            }

            if (selF) {
                selF.replaceChildren();
                filmes.forEach(f => {
                    const opt = document.createElement("option");
                    opt.value = f.idFilme;
                    opt.textContent = `${f.titulo} (${f.anoLancamento || 'Filme'})`;
                    selF.appendChild(opt);
                });
            }

            formVinculo.addEventListener("submit", async e => {
                e.preventDefault();
                const idLivro = Number(selL.value);
                const idFilme = Number(selF.value);
                const msgV = document.getElementById("mensagem-vinculo");

                msgV.textContent = "Criando vínculo multimídia...";
                try {
                    await api("/Adaptacao", {
                        method: "POST",
                        body: JSON.stringify({ idLivro, idFilme })
                    });
                    msgV.textContent = "Adaptação vinculada com sucesso!";
                    await carregarRankingCompleto();
                } catch (err) {
                    msgV.textContent = `Erro ao vincular: ${err.message}`;
                }
            });
        } catch (err) {
            console.error("Erro ao preparar formulário de vínculo:", err);
        }
    }

    async function carregarRankingCompleto() {
        if (!areaRanking) return;
        if (msg) msg.textContent = "Carregando ranking...";

        try {
            const ranking = await api("/Adaptacao/ranking");
            areaRanking.replaceChildren();

            if (!ranking || !ranking.length) {
                if (msg) msg.textContent = "Nenhuma adaptação vinculada ainda. Use o formulário acima para conectar livros a filmes!";
                return;
            }

            if (msg) msg.textContent = "";

            ranking.forEach((item, index) => {
                const card = document.createElement("article");
                card.className = "card-adaptacao-ranking";

                card.innerHTML = `
                    <div class="ranking-posicao">#${index + 1}</div>
                    <div class="adaptacao-comparativo">
                        <div class="lado-livro">
                            ${item.capaLivro ? `<img src="${item.capaLivro}" alt="Capa de ${item.tituloLivro}">` : `<div class="capa-vazia">${item.tituloLivro}</div>`}
                            <div class="lado-info">
                                <span class="lado-tipo">Livro Original</span>
                                <h3>${item.tituloLivro}</h3>
                                <p>Autor: <strong>${item.autorLivro}</strong></p>
                                <p style="margin-top:6px;">Média da Obra: ${renderEstrelas(item.mediaNotaLivro)}</p>
                            </div>
                        </div>
                        <div class="lado-filme">
                            ${item.posterFilme ? `<img src="${item.posterFilme}" alt="Pôster de ${item.tituloFilme}">` : `<div class="capa-vazia">${item.tituloFilme}</div>`}
                            <div class="lado-info">
                                <span class="lado-tipo">Adaptação Audiovisual</span>
                                <h3>${item.tituloFilme}</h3>
                                <p>${item.diretorFilme ? `Direção: <strong>${item.diretorFilme}</strong>` : ''}</p>
                                <p>${item.anoLancamentoFilme ? `Ano: <strong>${item.anoLancamentoFilme}</strong>` : ''}</p>
                            </div>
                        </div>
                    </div>
                    <div class="adaptacao-metricas">
                        <div class="metrica-nota">${item.mediaFidelidade ? item.mediaFidelidade.toFixed(1) : '-'}</div>
                        <div class="estrelas">${item.mediaFidelidade ? '★'.repeat(Math.round(item.mediaFidelidade)) : ''}</div>
                        <div class="metrica-rotulo">Fidelidade</div>
                        <small style="color:var(--suave); margin-top:8px;">${item.totalAvaliacoes} avaliações</small>
                    </div>
                `;

                areaRanking.appendChild(card);
            });
        } catch (e) {
            if (msg) msg.textContent = "Não foi possível carregar o ranking de adaptações.";
            console.error(e);
        }
    }

    await carregarRankingCompleto();
}

/* =========================================================
   7. DESTAQUES E FEED SOCIAL NA HOME
   ========================================================= */

async function carregarFeedSocial() {
    try {
        const feed = await api("/Review/feed");
        if (!feed) return;

        const statLivros = document.getElementById("stat-livros");
        const statAdaptacoes = document.getElementById("stat-adaptacoes");
        const statReviews = document.getElementById("stat-reviews");

        if (statLivros) statLivros.textContent = feed.totalLivrosCadastrados;
        if (statAdaptacoes) statAdaptacoes.textContent = feed.totalAdaptacoesCadastradas;
        if (statReviews) statReviews.textContent = feed.totalReviews;

        const lista = document.getElementById("inicio-feed-reviews");
        const msg = document.getElementById("inicio-mensagem-reviews");
        if (!lista) return;

        lista.replaceChildren();
        if (!feed.ultimasResenhas || !feed.ultimasResenhas.length) {
            if (msg) msg.textContent = "Nenhuma resenha recente encontrada.";
            return;
        }

        if (msg) msg.textContent = "";
        feed.ultimasResenhas.slice(0, 4).forEach(r => {
            const card = document.createElement("article");
            card.className = "review-card-dupla";
            const dataFmt = r.dataCriacao ? new Date(r.dataCriacao).toLocaleDateString("pt-BR") : "";

            card.innerHTML = `
                <div class="review-cabecalho">
                    <div>
                        <span class="review-usuario">${r.nomeUsuario}</span>
                        <span style="color:var(--suave); font-size:13px;"> avaliou </span>
                        <strong style="color:var(--texto);">${r.tituloLivro || "Obra"}</strong>
                        ${r.tituloFilme ? `<span style="color:var(--suave); font-size:13px;"> (Filme: ${r.tituloFilme})</span>` : ""}
                    </div>
                    <div class="review-notas-badges">
                        <span class="badge-nota">Obra: ${renderEstrelas(r.notaLivro)}</span>
                        ${r.assistiuFilme && r.notaFidelidade ? `<span class="badge-nota destaque-fidelidade">Fidelidade: ${renderEstrelas(r.notaFidelidade)}</span>` : ""}
                    </div>
                </div>
                <p>${r.comentario || ""}</p>
                <div class="review-rodape">
                    <span>${r.assistiuFilme ? "✓ Assistiu ao filme e leu o livro" : "Lido apenas o livro"}</span>
                    <span>${dataFmt}</span>
                </div>
            `;
            lista.appendChild(card);
        });
    } catch (e) {
        console.error("Erro ao carregar feed social:", e);
    }
}

async function carregarRankingInicio() {
    const area = document.getElementById("inicio-ranking");
    const msg = document.getElementById("inicio-mensagem-ranking");
    if (!area) return;

    try {
        const ranking = await api("/Adaptacao/ranking");
        area.replaceChildren();

        if (!ranking || !ranking.length) {
            if (msg) msg.textContent = "Ainda não há adaptações cadastradas com avaliações.";
            return;
        }

        if (msg) msg.textContent = "";

        // Exibe as duas principais no início
        ranking.slice(0, 2).forEach((item, index) => {
            const card = document.createElement("article");
            card.className = "card-adaptacao-ranking";

            card.innerHTML = `
                <div class="ranking-posicao">#${index + 1}</div>
                <div class="adaptacao-comparativo">
                    <div class="lado-livro">
                        ${item.capaLivro ? `<img src="${item.capaLivro}" alt="Capa de ${item.tituloLivro}">` : `<div class="capa-vazia">${item.tituloLivro}</div>`}
                        <div class="lado-info">
                            <span class="lado-tipo">Livro Original</span>
                            <h3>${item.tituloLivro}</h3>
                            <p>Autor: <strong>${item.autorLivro}</strong></p>
                            <p style="margin-top:6px;">Média da Obra: ${renderEstrelas(item.mediaNotaLivro)}</p>
                        </div>
                    </div>
                    <div class="lado-filme">
                        ${item.posterFilme ? `<img src="${item.posterFilme}" alt="Pôster de ${item.tituloFilme}">` : `<div class="capa-vazia">${item.tituloFilme}</div>`}
                        <div class="lado-info">
                            <span class="lado-tipo">Adaptação Cinematográfica</span>
                            <h3>${item.tituloFilme}</h3>
                            <p>${item.diretorFilme ? `Direção: <strong>${item.diretorFilme}</strong>` : ''}</p>
                            <p>${item.anoLancamentoFilme ? `Ano: <strong>${item.anoLancamentoFilme}</strong>` : ''}</p>
                        </div>
                    </div>
                </div>
                <div class="adaptacao-metricas">
                    <div class="metrica-nota">${item.mediaFidelidade ? item.mediaFidelidade.toFixed(1) : '-'}</div>
                    <div class="estrelas">${item.mediaFidelidade ? '★'.repeat(Math.round(item.mediaFidelidade)) : ''}</div>
                    <div class="metrica-rotulo">Fidelidade</div>
                    <small style="color:var(--suave); margin-top:8px;">${item.totalAvaliacoes} avaliações</small>
                </div>
            `;

            area.appendChild(card);
        });
    } catch (e) {
        console.error("Erro ao carregar ranking inicial:", e);
    }
}

/* =========================================================
   8. AUTENTICAÇÃO COM BCRYPT
   ========================================================= */

function configurarLogin() {
    const form = document.getElementById("form-login");
    if (!form) return;

    const alternar = document.getElementById("alternar-cadastro");
    const campos = document.getElementById("campos-cadastro");
    const msg = document.getElementById("mensagem-login");
    const sair = document.getElementById("sair-conta");
    let modoCadastro = false;

    const render = () => {
        if (campos) campos.hidden = !modoCadastro;
        form.querySelector('button[type="submit"]').textContent = modoCadastro ? "Criar Conta Segura" : "Entrar";
        alternar.textContent = modoCadastro ? "Já possuo uma conta" : "Criar nova conta";
        const u = usuarioAtual();
        if (sair) sair.hidden = !u;
        if (u) msg.textContent = `Você está conectado como ${u.nome} (${u.email}).`;
    };

    alternar?.addEventListener("click", () => {
        modoCadastro = !modoCadastro;
        render();
    });

    sair?.addEventListener("click", () => {
        localStorage.removeItem("resenhario_usuario");
        render();
        msg.textContent = "Você saiu da sua conta.";
    });

    render();

    form.addEventListener("submit", async e => {
        e.preventDefault();
        msg.textContent = "Processando autenticação segura (BCrypt)...";

        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value;

        try {
            const dados = modoCadastro
                ? { nome: document.getElementById("nome").value.trim(), email, senha }
                : { email, senha };

            const usuario = await api(modoCadastro ? "/Auth/cadastro" : "/Auth/login", {
                method: "POST",
                body: JSON.stringify(dados)
            });

            localStorage.setItem("resenhario_usuario", JSON.stringify(usuario));
            msg.textContent = modoCadastro ? "Conta criada com sucesso com BCrypt!" : "Login realizado com sucesso!";
            render();
            setTimeout(() => {
                location.href = "../index.html";
            }, 700);
        } catch (err) {
            msg.textContent = err.message || "Falha na autenticação.";
        }
    });
}
