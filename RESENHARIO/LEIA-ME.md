# Resenhário — guia de execução

## O que o projeto oferece
- Página inicial com catálogo de livros, filmes e séries.
- Pesquisa de livros pela Open Library (sem chave de API).
- Pesquisa de filmes pelo Wikidata (sem chave; pode sofrer indisponibilidade do serviço).
- Pesquisa de séries pela TVmaze (sem chave de API).
- Cadastro e login com hash de senha no backend C#.
- Adição de livros, filmes e séries ao catálogo MySQL.
- Estante por usuário, com atualização de status e remoção.
- Publicação e listagem de resenhas escritas pelos usuários.

## 1. Banco de dados
1. Abra o MySQL Workbench e conecte ao mesmo servidor em que está `resenhario_db`.
2. Execute `BANCO DE DADOS/05_atualizar_banco.sql` uma vez. Esse arquivo não apaga as tabelas e os registros existentes; ele cria a tabela Series e adapta as colunas necessárias.
3. Opcional: execute `06_limpar_resenhas_de_teste.sql` se quiser remover apenas os comentários fictícios usados nos testes. Não execute se quiser mantê-los.
4. Configure a conexão no `BACKEND/Resenhario.Api/appsettings.json`. Troque `COLOQUE_SUA_SENHA` pela senha local do MySQL. Não publique esse arquivo com credenciais reais.

## 2. Backend
No terminal do VS Code:
```bash
cd BACKEND/Resenhario.Api
dotnet restore
dotnet run --launch-profile http
```
A API fica em `http://localhost:5131`. Mantenha o terminal aberto enquanto usa o site.

## 3. Frontend
Abra a pasta `frontend` com a extensão Live Server do VS Code e abra `index.html`.
Não abra o HTML por `file://` se o navegador bloquear chamadas externas; use Live Server.

## 4. Como testar
1. Acesse `paginas/login.html` e crie uma conta com nome, e-mail e senha de pelo menos 6 caracteres.
2. Acesse Filmes, Livros ou Séries e pesquise um título.
3. Use “Adicionar ao catálogo” para salvar o resultado no banco.
4. Use “Minha estante” no card para guardar o item na conta conectada.
5. Na estante, altere o status ou remova o item.
6. Em Resenhas, selecione um livro, dê uma nota e escreva seu próprio comentário.

## Importante para a apresentação
- O login usa hash de senha no backend, mas a sessão atual do frontend é guardada no localStorage e o projeto ainda não tem JWT/cookies seguros. É adequado como protótipo acadêmico local, não para colocar publicamente em produção sem reforçar autenticação/autorização.
- Não existem comentários de exemplo novos sendo criados automaticamente. Se a base tiver os comentários fictícios antigos, use o script opcional `06_limpar_resenhas_de_teste.sql`.
- Wikidata/TVmaze/Open Library são serviços externos; se um deles estiver indisponível, a pesquisa pode falhar temporariamente.
- O ambiente em que os arquivos foram ajustados não tem o SDK .NET instalado, portanto compile/teste a API no seu computador e envie a mensagem exata se ocorrer erro.
