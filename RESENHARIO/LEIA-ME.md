# 📚 Resenhário — Catálogo Literário Social & Conexão Audiovisual

Sistema web desenvolvido em **C# com ASP.NET Core (.NET 10)** voltado ao estímulo do hábito de leitura através do diálogo entre **literatura e cinema**, associando diretamente obras literárias às suas respectivas adaptações cinematográficas.

Projeto desenvolvido para a disciplina de **Desenvolvimento de Software Visual** da **Universidade Positivo (2026)**.

---

## 🎯 Objetivos & Funcionalidades (Alinhadas ao Escopo)

- 🔐 **Autenticação Segura com BCrypt**: Cadastro e login de usuários com hash criptográfico seguro de senhas utilizando a biblioteca `BCrypt.Net-Next`.
- 📖 **Integração com Google Books API**: Busca e cadastro automatizado de livros diretamente pelo backend em C# consumindo a API oficial com `HttpClient`.
- 🎬 **Integração com TMDB API**: Consulta de pôsteres em alta definição, diretores e ano de lançamento consumindo a The Movie Database API com `HttpClient`.
- 🗄️ **Estante Virtual Pessoal**: Controle rigoroso dos status de leitura oficiais exigidos pelo escopo:
  - **Quero Ler**
  - **Lendo**
  - **Lido**
  - **Abandonado**
- 🔗 **Módulo de Vínculo Multimídia**: Associação direta entre obras literárias e adaptações cinematográficas.
- ⭐ **Resenhas Comunitárias com Avaliação Dupla**:
  - Nota da obra literária (1 a 5 estrelas).
  - Avaliação comparativa de fidelidade filme vs livro (1 a 5 estrelas).
- 🏆 **Ranking das Melhores Adaptações**: Classificação dinâmica das produções com base na média de fidelidade atribuída pelos leitores.
- 🌐 **Feed Comunitário & Estatísticas**: Painel com métricas da plataforma em tempo real e as últimas resenhas publicadas.

---

## 🛠️ Stack Tecnológica & Ferramentas

| Componente | Tecnologia |
|---|---|
| **Linguagem & Framework** | C# (.NET 10) com ASP.NET Core Web API |
| **Banco de Dados & ORM** | MySQL 8.0+ com Entity Framework Core 9 / Pomelo |
| **Criptografia** | BCrypt (`BCrypt.Net-Next 4.0.3`) |
| **Consumo de APIs Externas** | `HttpClient` nativo do C# (Google Books API e TMDB API) |
| **Frontend** | HTML5 semântico, CSS3 responsivo e JavaScript Vanilla moderno |
| **Gestão e Versionamento** | Git, GitHub e Trello (Kanban) |

---

## 👥 Matriz de Responsabilidades da Equipe

| Nome | RGM | Função |
|---|---|---|
| **Alejandro Abraham Leon Benavente** | 43042325 | Scrum Master |
| **John Vitor do Carmo Barbosa** | 43439314 | Banco de Dados |
| **Lucas Gaeski Borges** | 43405983 | Analista de Testes |
| **Ketelyn Ramos Zaleski** | 42855241 | Front-end / Back-end |
| **Matheus Alexandre Vieira** | 45405983 | QA (Garantia de Qualidade) |
| **Vinicius Lima Pereira** | 42451442 | Back-end / Front-end |

---

## 🚀 Como Executar o Projeto

### 1. Banco de Dados (MySQL)

1. Abra o **MySQL Workbench** ou seu cliente MySQL preferido.
2. Para uma instalação limpa:
   - Execute o script `BANCO DE DADOS/01_criar_banco.sql`.
   - Em seguida, execute `BANCO DE DADOS/02_dados_teste.sql` para carregar livros, filmes, adaptações e usuários já com hashes BCrypt prontos para teste.
3. Se você já possuía o banco populado anteriormente:
   - Execute apenas `BANCO DE DADOS/07_alinhar_escopo.sql` para adicionar a coluna `NotaFidelidade` sem perder seus dados.
4. Ajuste a string de conexão no arquivo `BACKEND/Resenhario.Api/appsettings.json` com seu usuário e senha local do MySQL:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "server=localhost;port=3306;database=resenhario_db;user=root;password=SUA_SENHA_AQUI;"
   }
   ```

### 2. Backend (API ASP.NET Core C#)

Abra o terminal na pasta da API:
```bash
cd "BACKEND/Resenhario.Api"
dotnet restore
dotnet run --launch-profile http
```
A API iniciará no endereço: `http://localhost:5131`  
Documentação OpenAPI/Swagger (quando em modo Development): `http://localhost:5131/openapi/v1.json`

### 3. Frontend

Abra a pasta `frontend` no seu editor (como VS Code) e utilize a extensão **Live Server** abrindo o arquivo `index.html`.

> **Importante:** Sempre abra via servidor HTTP local (como Live Server em `http://127.0.0.1:5500` ou similar), evitando o protocolo `file:///` para permitir requisições seguras à API.

---

## 🧪 Roteiro de Testes e Validação do Escopo

1. **Autenticação Segura (BCrypt)**:
   - Acesse `paginas/login.html`.
   - Crie uma conta nova informando Nome, E-mail e Senha (mínimo 6 caracteres). A senha será gravada com salt e hash via BCrypt.
   - Faça login com as credenciais criadas ou com a conta de teste `john@email.com` / senha: `senha123`.

2. **Busca na Google Books API**:
   - Acesse `paginas/livros.html`.
   - Digite um termo como *"Dom Casmurro"*, *"Percy Jackson"* ou *"Tolkien"*.
   - A busca será intermediada pelo serviço em C# com `HttpClient`.
   - Clique em **Adicionar ao Catálogo** ou **＋ Minha estante**.

3. **Busca no TMDB**:
   - Acesse `paginas/filmes.html`.
   - Pesquise por títulos como *"O Senhor dos Anéis"*, *"Duna"* ou *"Jogos Vorazes"*.
   - Veja o pôster oficial, diretor e ano trazidos pela API externa. Adicione ao catálogo.

4. **Estante Virtual Pessoal com Status de Leitura**:
   - Acesse `paginas/estante.html`.
   - Filtre seus itens por status: **Todos**, **Quero Ler**, **Lendo**, **Lido** ou **Abandonado**.
   - Altere o status no seletor para atualizar a base de dados em tempo real.

5. **Módulo de Vínculo Multimídia & Ranking de Adaptações**:
   - Acesse `paginas/ranking.html`.
   - Visualize a tabela comparativa entre o livro original e o filme correspondente, com pôsteres lado a lado e média de fidelidade.
   - Use o formulário no topo para vincular novos livros a filmes.

6. **Resenhas Comunitárias com Avaliação Dupla**:
   - Acesse `paginas/reviews.html`.
   - Selecione o livro lido e marque sua nota de 1 a 5 estrelas.
   - Marque a opção *"Eu assisti à adaptação cinematográfica desta obra"*.
   - Selecione o filme e atribua a nota de fidelidade de 1 a 5 estrelas.
   - Escreva o texto crítico e publique. A resenha aparecerá instantaneamente no feed social e atualizará o ranking!
