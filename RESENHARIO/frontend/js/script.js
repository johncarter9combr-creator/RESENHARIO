const API_URL = "http://localhost:5131/api";
const OPEN_LIBRARY_URL = "https://openlibrary.org/search.json";
const WIKIDATA_URL = "https://query.wikidata.org/sparql";
const TVMAZE_URL = "https://api.tvmaze.com/search/shows?q=";

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
        const detalhe = await resposta.text();
        throw new Error(detalhe || `Erro HTTP ${resposta.status}`);
    }
    if (resposta.status === 204) return null;
    const texto = await resposta.text();
    return texto ? JSON.parse(texto) : null;
}

async function buscarCatalogo(tipo) { return api(`/${tipo}`); }

document.addEventListener("DOMContentLoaded", () => {
    carregarCatalogo();
    configurarBuscaLivros();
    configurarBuscaFilmes();
    configurarBuscaSeries();
    configurarLogin();
    configurarEstante();
    configurarReviews();
    atualizarNavegacao();
});

function atualizarNavegacao() {
    const usuario = usuarioAtual();
    document.querySelectorAll('a[href*="login.html"]').forEach(a => {
        if (usuario) { a.textContent = `Olá, ${usuario.nome}`; }
    });
}

async function carregarCatalogo() {
    const caminho = location.pathname.toLowerCase();
    const inicio = caminho.endsWith("/index.html") || caminho.endsWith("/");
    if (inicio) {
        await Promise.allSettled([
            carregarLivrosEm("inicio-livros", "inicio-mensagem-livros"),
            carregarFilmesEm("inicio-filmes", "inicio-mensagem-filmes"),
            carregarSeriesEm("inicio-series", "inicio-mensagem-series")
        ]);
    }
    if (caminho.endsWith("/livros.html")) await carregarLivrosEm("lista-livros", "mensagem-catalogo", true);
    if (caminho.endsWith("/filmes.html")) await carregarFilmesEm("lista-filmes", "mensagem-filmes", true);
    if (caminho.endsWith("/series.html")) await carregarSeriesEm("lista-series", "mensagem-series", true);
}

function criarCapaVazia(titulo) {
    const div = document.createElement("div"); div.className = "capa-vazia"; div.textContent = titulo || "Sem imagem"; return div;
}

function criarCard(item) {
    const card = document.createElement("article"); card.className = "card-capa";
    if (item.imagem) {
        const img = document.createElement("img"); img.src = item.imagem; img.alt = `Capa de ${item.titulo}`; img.loading = "lazy";
        img.onerror = () => img.replaceWith(criarCapaVazia(item.titulo)); card.appendChild(img);
    } else card.appendChild(criarCapaVazia(item.titulo));
    const info = document.createElement("div"); info.className = "card-info";
    const titulo = document.createElement("h3"); titulo.textContent = item.titulo || "Sem título";
    const autor = document.createElement("p"); autor.textContent = item.autor || "";
    const descricao = document.createElement("p"); descricao.textContent = item.descricao || "";
    info.append(titulo, autor, descricao);
    if (item.botao) { const b = document.createElement("button"); b.textContent = item.botao.texto; b.addEventListener("click", item.botao.acao); info.appendChild(b); }
    card.appendChild(info); return card;
}

function exigirLogin() {
    const usuario = usuarioAtual();
    if (!usuario) { alert("Entre ou crie uma conta para salvar itens na sua estante."); location.href = "login.html"; return null; }
    return usuario;
}

async function adicionarAEstante(ids) {
    const usuario = exigirLogin(); if (!usuario) return;
    const tipo = ids.idLivros ? "Quero ler" : "Quero ver";
    try {
        await api("/Estante", { method: "POST", body: JSON.stringify({ idUsuario: usuario.idUsuario, idLivros: ids.idLivros || null, idFilme: ids.idFilme || null, idSerie: ids.idSerie || null, status: tipo }) });
        alert("Adicionado à sua estante!");
    } catch (e) { alert(e.message.includes("já está") ? "Esse item já está na sua estante." : `Não foi possível salvar: ${e.message}`); }
}

async function carregarLivrosEm(listaId, mensagemId, permitirEstante = false) {
    const lista = document.getElementById(listaId), msg = document.getElementById(mensagemId); if (!lista || !msg) return;
    try {
        const livros = await buscarCatalogo("Livro"); lista.replaceChildren();
        if (!livros.length) { msg.textContent = "Nenhum livro cadastrado ainda."; return; }
        msg.textContent = "";
        livros.forEach(l => lista.appendChild(criarCard({ titulo:l.titulo, autor:l.autor, imagem:l.capaUrl, descricao:l.sinopse, botao: permitirEstante ? { texto:"＋ Minha estante", acao:() => adicionarAEstante({idLivros:l.idLivros}) } : null })));
    } catch(e) { msg.textContent = "Não foi possível carregar os livros. Confira se a API está ligada."; console.error(e); }
}

async function carregarFilmesEm(listaId, mensagemId, permitirEstante = false) {
    const lista = document.getElementById(listaId), msg = document.getElementById(mensagemId); if (!lista || !msg) return;
    try {
        const filmes = await buscarCatalogo("Filme"); lista.replaceChildren();
        if (!filmes.length) { msg.textContent = "Nenhum filme cadastrado ainda."; return; }
        msg.textContent = "";
        filmes.forEach(f => lista.appendChild(criarCard({ titulo:f.titulo, autor:f.diretor, imagem:f.posterUrl, descricao:f.anoLancamento ? `Lançamento: ${f.anoLancamento}` : "", botao: permitirEstante ? { texto:"＋ Minha estante", acao:() => adicionarAEstante({idFilme:f.idFilme}) } : null })));
    } catch(e) { msg.textContent = "Não foi possível carregar os filmes. Confira se a API está ligada."; console.error(e); }
}

async function carregarSeriesEm(listaId, mensagemId, permitirEstante = false) {
    const lista = document.getElementById(listaId), msg = document.getElementById(mensagemId); if (!lista || !msg) return;
    try {
        const series = await buscarCatalogo("Serie"); lista.replaceChildren();
        if (!series.length) { msg.textContent = "Nenhuma série cadastrada ainda. Pesquise abaixo para adicionar."; return; }
        msg.textContent = "";
        series.forEach(s => lista.appendChild(criarCard({ titulo:s.titulo, imagem:s.imagemUrl, descricao:s.dataEstreia ? `Estreia: ${s.dataEstreia}` : s.sinopse, botao: permitirEstante ? { texto:"＋ Minha estante", acao:() => adicionarAEstante({idSerie:s.idSerie}) } : null })));
    } catch(e) { msg.textContent = "Não foi possível carregar séries. Execute 05_atualizar_banco.sql e reinicie a API."; console.error(e); }
}

function configurarBuscaLivros() {
    const form = document.getElementById("form-busca-livros"); if (!form) return;
    form.addEventListener("submit", async e => {
        e.preventDefault(); const termo = document.getElementById("termo-livro").value.trim();
        const msg = document.getElementById("mensagem-busca"), area = document.getElementById("resultados-busca"); area.replaceChildren(); msg.textContent = "Pesquisando livros...";
        try {
            const p = new URLSearchParams({ q:termo, fields:"key,title,author_name,first_publish_year,cover_i,isbn", limit:"12" });
            const r = await fetch(`${OPEN_LIBRARY_URL}?${p}`); if (!r.ok) throw new Error(`Open Library: ${r.status}`);
            const docs = (await r.json()).docs || []; if (!docs.length) { msg.textContent = "Nenhum livro encontrado."; return; }
            msg.textContent = `${docs.length} resultado(s). Clique para salvar no catálogo.`;
            docs.forEach(d => {
                const livro = { id:`openlibrary:${d.key}`, titulo:d.title || "Título não informado", autor:(d.author_name || ["Autor não informado"]).join(", "), isbn:d.isbn?.[0] || "", capaUrl:d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : "" };
                const c = criarCard({ titulo:livro.titulo, autor:livro.autor, imagem:livro.capaUrl, descricao:d.first_publish_year ? `Publicado em ${d.first_publish_year}` : "" });
                const b = document.createElement("button"); b.textContent = "Adicionar ao catálogo"; b.onclick = () => salvarLivro(livro, b, msg);
                c.querySelector(".card-info").appendChild(b); area.appendChild(c);
            });
        } catch(err) { console.error(err); msg.textContent = "Não foi possível pesquisar livros. Confira sua conexão."; }
    });
}

async function salvarLivro(livro, botao, msg) {
    botao.disabled = true; botao.textContent = "Salvando...";
    try { await api("/Livro", { method:"POST", body:JSON.stringify({ googleBId:livro.id, titulo:livro.titulo, autor:livro.autor || "Autor não informado", sinopse:null, isbn:livro.isbn || null, capaUrl:livro.capaUrl || null }) });
        botao.textContent="Adicionado"; msg.textContent=`“${livro.titulo}” foi adicionado ao catálogo.`; await carregarLivrosEm("lista-livros","mensagem-catalogo",true);
    } catch(e) { botao.disabled=false; botao.textContent="Tentar novamente"; msg.textContent=`Erro ao salvar livro: ${e.message}`; }
}

function configurarBuscaFilmes() {
    const form=document.getElementById("form-busca-filmes"); if(!form)return;
    form.addEventListener("submit",async e=>{
        e.preventDefault(); const termo=document.getElementById("termo-filme").value.trim(), msg=document.getElementById("mensagem-busca-filmes"), area=document.getElementById("resultados-filmes"); area.replaceChildren(); msg.textContent="Pesquisando filmes...";
        // Wikidata não exige chave. Labels são resolvidos pelo serviço oficial.
        const literal=JSON.stringify(termo).replace(/\\u/g,"\\u");
        const q=`SELECT ?filme ?filmeLabel ?data ?diretorLabel ?imagem WHERE { ?filme wdt:P31/wdt:P279* wd:Q11424. OPTIONAL {?filme wdt:P577 ?data.} OPTIONAL {?filme wdt:P57 ?diretor.} OPTIONAL {?filme wdt:P18 ?imagem.} SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". } FILTER(CONTAINS(LCASE(STR(?filmeLabel)), LCASE(${literal}))) } ORDER BY DESC(?data) LIMIT 12`;
        try { const r=await fetch(`${WIKIDATA_URL}?${new URLSearchParams({query:q,format:"json"})}`,{headers:{Accept:"application/sparql-results+json"}}); if(!r.ok)throw new Error(`Wikidata HTTP ${r.status}`); const rows=(await r.json()).results?.bindings||[]; if(!rows.length){msg.textContent="Nenhum filme encontrado. Tente o título em português ou inglês.";return;} msg.textContent=`${rows.length} filme(s) encontrado(s).`;
            rows.forEach(row=>{const id=row.filme.value.split("/").pop(), titulo=row.filmeLabel?.value||"Filme"; const filme={tmdbId:id,titulo,diretor:row.diretorLabel?.value||"",anoLancamento:row.data?.value?Number(row.data.value.slice(0,4)):null,posterUrl:row.imagem?.value?`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(row.imagem.value.split("/").pop())}`:""}; const c=criarCard({titulo,autor:filme.diretor,imagem:filme.posterUrl,descricao:filme.anoLancamento?`Lançamento: ${filme.anoLancamento}`:""}); const b=document.createElement("button");b.textContent="Adicionar ao catálogo";b.onclick=()=>salvarFilme(filme,b,msg);c.querySelector(".card-info").appendChild(b);area.appendChild(c);});
        }catch(err){console.error(err);msg.textContent="A pesquisa externa falhou. Tente novamente; o serviço Wikidata pode estar temporariamente indisponível.";}
    });
}
async function salvarFilme(f,b,msg){b.disabled=true;b.textContent="Salvando...";try{await api("/Filme",{method:"POST",body:JSON.stringify({tmdbId:f.tmdbId,titulo:f.titulo,diretor:f.diretor,anoLancamento:f.anoLancamento,posterUrl:f.posterUrl||null})});b.textContent="Adicionado";msg.textContent=`“${f.titulo}” foi salvo no catálogo.`;await carregarFilmesEm("lista-filmes","mensagem-filmes",true);}catch(e){b.disabled=false;b.textContent="Tentar novamente";msg.textContent=`Não foi possível salvar: ${e.message}`;}}

function configurarBuscaSeries(){const form=document.getElementById("form-busca-series");if(!form)return;form.addEventListener("submit",async e=>{e.preventDefault();const termo=document.getElementById("termo-serie").value.trim(),msg=document.getElementById("mensagem-busca-series"),area=document.getElementById("resultados-series");area.replaceChildren();msg.textContent="Pesquisando séries...";try{const r=await fetch(`${TVMAZE_URL}${encodeURIComponent(termo)}`);if(!r.ok)throw new Error(`TVmaze HTTP ${r.status}`);const rows=await r.json();if(!rows.length){msg.textContent="Nenhuma série encontrada.";return;}msg.textContent=`${rows.length} série(s) encontrada(s).`;rows.slice(0,12).forEach(x=>{const s=x.show;const serie={fonteId:`tvmaze:${s.id}`,titulo:s.name||"Série",sinopse:(s.summary||"").replace(/<[^>]*>/g," ").trim(),imagemUrl:s.image?.medium||s.image?.original||"",dataEstreia:s.premiered||""};const c=criarCard({titulo:serie.titulo,imagem:serie.imagemUrl,descricao:serie.dataEstreia?`Estreia: ${serie.dataEstreia}`:serie.sinopse});const b=document.createElement("button");b.textContent="Adicionar ao catálogo";b.onclick=async()=>{b.disabled=true;b.textContent="Salvando...";try{await api("/Serie",{method:"POST",body:JSON.stringify(serie)});b.textContent="Adicionado";msg.textContent=`“${serie.titulo}” foi salva no catálogo.`;await carregarSeriesEm("lista-series","mensagem-series",true);}catch(err){b.disabled=false;b.textContent="Tentar novamente";msg.textContent=err.message;}};c.querySelector(".card-info").appendChild(b);area.appendChild(c);});}catch(err){console.error(err);msg.textContent="Não foi possível pesquisar séries. Confira a conexão.";}});}

function configurarLogin(){const form=document.getElementById("form-login");if(!form)return;const alternar=document.getElementById("alternar-cadastro"),campos=document.getElementById("campos-cadastro"),msg=document.getElementById("mensagem-login"),sair=document.getElementById("sair-conta");let cadastro=false;
    const render=()=>{if(campos)campos.hidden=!cadastro;form.querySelector('button[type="submit"]').textContent=cadastro?"Criar conta":"Entrar";alternar.textContent=cadastro?"Já tenho uma conta":"Criar conta";const u=usuarioAtual();if(sair)sair.hidden=!u;if(u)msg.textContent=`Você está conectado como ${u.nome}.`;};
    alternar?.addEventListener("click",()=>{cadastro=!cadastro;render();});sair?.addEventListener("click",()=>{localStorage.removeItem("resenhario_usuario");render();msg.textContent="Você saiu da conta.";});render();
    form.addEventListener("submit",async e=>{e.preventDefault();msg.textContent="Processando...";const email=document.getElementById("email").value.trim(),senha=document.getElementById("senha").value;try{const dados=cadastro?{nome:document.getElementById("nome").value.trim(),email,senha}:{email,senha};const u=await api(cadastro?"/Auth/cadastro":"/Auth/login",{method:"POST",body:JSON.stringify(dados)});localStorage.setItem("resenhario_usuario",JSON.stringify(u));msg.textContent=cadastro?"Conta criada com sucesso!":"Login realizado!";render();setTimeout(()=>location.href="../index.html",700);}catch(err){msg.textContent=err.message||"Não foi possível entrar.";}});}

async function configurarEstante(){const area=document.getElementById("itens-estante"),msg=document.getElementById("mensagem-estante");if(!area||!msg)return;const u=usuarioAtual();if(!u){msg.textContent="Entre na sua conta para visualizar sua estante.";return;}msg.textContent="Carregando sua estante...";try{const itens=await api(`/Estante?usuarioId=${u.idUsuario}`);area.replaceChildren();if(!itens.length){msg.textContent="Sua estante está vazia. Pesquise livros, filmes ou séries e adicione o que quiser guardar.";return;}msg.textContent="";itens.forEach(item=>{const c=criarCard({titulo:item.titulo,autor:item.autor,descricao:item.tipo});const info=c.querySelector(".card-info");const select=document.createElement("select");const statuses=item.tipo==="Livro"?["Quero ler","Lendo","Lido"]:["Quero ver","Assistindo","Assistido"];statuses.forEach(s=>{const o=document.createElement("option");o.value=s;o.textContent=s;o.selected=s===item.status;select.appendChild(o);});select.onchange=async()=>{try{await api(`/Estante/${item.idEstante}?usuarioId=${u.idUsuario}`,{method:"PUT",body:JSON.stringify({status:select.value})});}catch(e){msg.textContent=e.message;}};const remover=document.createElement("button");remover.textContent="Remover";remover.onclick=async()=>{if(!confirm("Remover este item da sua estante?"))return;try{await api(`/Estante/${item.idEstante}?usuarioId=${u.idUsuario}`,{method:"DELETE"});c.remove();if(!area.children.length)msg.textContent="Sua estante está vazia.";}catch(e){msg.textContent=e.message;}};info.append(select,remover);area.appendChild(c);});}catch(e){msg.textContent=`Não foi possível carregar a estante: ${e.message}`;}}

async function configurarReviews(){const form=document.getElementById("form-review"),lista=document.getElementById("lista-reviews"),msg=document.getElementById("mensagem-reviews");if(!lista)return;const render=async()=>{try{const reviews=await api("/Review");lista.replaceChildren();if(!reviews.length){lista.textContent="Ainda não há resenhas. Seja a primeira pessoa a compartilhar sua opinião.";return;}reviews.forEach(r=>{const box=document.createElement("article");box.className="review-card";const h=document.createElement("h3");h.textContent=`${r.titulo||"Obra"} — ${r.notaLivro??r.nota??"-"}/10`;const p=document.createElement("p");p.textContent=r.comentario||"";const by=document.createElement("small");by.textContent=`Por ${r.nomeUsuario||"Usuário"}`;box.append(h,p,by);lista.appendChild(box);});}catch(e){lista.textContent="Não foi possível carregar as resenhas.";console.error(e);}};
    if(form){try{const livros=await api("/Livro"),sel=document.getElementById("review-livro");sel.replaceChildren();livros.forEach(l=>{const o=document.createElement("option");o.value=l.idLivros;o.textContent=l.titulo;sel.appendChild(o);});}catch(e){if(msg)msg.textContent="Não foi possível carregar os livros.";}form.addEventListener("submit",async e=>{e.preventDefault();const u=exigirLogin();if(!u)return;const idLivro=Number(document.getElementById("review-livro").value);if(!idLivro){msg.textContent="Cadastre um livro antes de publicar uma resenha.";return;}try{await api("/Review",{method:"POST",body:JSON.stringify({idUsuario:u.idUsuario,idLivro,notaLivro:Number(document.getElementById("review-nota").value),comentario:document.getElementById("review-comentario").value.trim(),assistiuFilme:false,nota:null,voto:null})});form.reset();msg.textContent="Resenha publicada!";await render();}catch(err){msg.textContent=`Não foi possível publicar: ${err.message}`;}});}await render();}
