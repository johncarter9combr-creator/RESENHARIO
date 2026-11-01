USE resenhario_db;

-- =========================================
-- 1. USUÁRIOS DE TESTE
-- =========================================

INSERT INTO Usuarios
    (Nome, Email, SenhaHash, DataCadastro)
VALUES
    ('John Silva', 'john@email.com', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW()),
    ('Lucas Santos', 'lucas@email.com', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW()),
    ('Ketelyn Zaleski', 'ketelyn@email.com', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW());


-- =========================================
-- 2. LIVROS (Metadados compatíveis com Google Books)
-- =========================================

INSERT INTO Livros
    (GoogleBId, Titulo, Autor, Sinopse, Isbn, CapaUrl)
VALUES
    (
        'ha9bDwAAQBAJ',
        'O Hobbit',
        'J.R.R. Tolkien',
        'Bilbo Bolseiro era um dos mais respeitáveis hobbits de todo o Condado até que, certo dia, o mago Gandalf bate à sua porta acompanhado de treze anões para uma aventura inesperada.',
        '9788595084742',
        'https://books.google.com/books/content?id=ha9bDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
    ),
    (
        '5iTebBW-BoMC',
        'Harry Potter e a Pedra Filosofal',
        'J.K. Rowling',
        'Harry Potter é um garoto órfão que vive infeliz com seus tios até receber uma carta misteriosa o convidando para ingressar na Escola de Magia e Bruxaria de Hogwarts.',
        '9788532530783',
        'https://books.google.com/books/content?id=5iTebBW-BoMC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
    ),
    (
        'Zf-rDgAAQBAJ',
        'Jogos Vorazes',
        'Suzanne Collins',
        'Nas ruínas de um lugar antigamente conhecido como América do Norte, a nação de Panem obriga cada um dos seus doze distritos a enviar um casal de jovens para lutar até a morte.',
        '9788579800245',
        'https://books.google.com/books/content?id=Zf-rDgAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
    ),
    (
        '4O1yDwAAQBAJ',
        'Duna',
        'Frank Herbert',
        'Uma obra prima da ficção científica que envolve política, religião e poder no planeta árido de Arrakis.',
        '9788576573135',
        'https://books.google.com/books/content?id=4O1yDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
    );


-- =========================================
-- 3. FILMES (Metadados compatíveis com TMDB)
-- =========================================

INSERT INTO Filmes
    (TmdbId, Titulo, Diretor, AnoLancamento, PosterUrl)
VALUES
    (
        '49051',
        'O Hobbit: Uma Jornada Inesperada',
        'Peter Jackson',
        2012,
        'https://image.tmdb.org/t/p/w500/yW4h4rF2v13yqV5qgGg0U0mH2.jpg'
    ),
    (
        '671',
        'Harry Potter e a Pedra Filosofal',
        'Chris Columbus',
        2001,
        'https://image.tmdb.org/t/p/w500/wuMc08IPKEatv9rnMNXvIDxqP4W.jpg'
    ),
    (
        '70160',
        'Jogos Vorazes',
        'Gary Ross',
        2012,
        'https://image.tmdb.org/t/p/w500/yvi9Qe1V3vT6oHl8zF49nQ.jpg'
    ),
    (
        '438631',
        'Duna',
        'Denis Villeneuve',
        2021,
        'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg'
    );


-- =========================================
-- 4. ADAPTAÇÕES (Vínculo Livro ↔ Filme)
-- =========================================

INSERT INTO Adaptacoes
    (IdLivro, IdFilme, DataVinculo)
VALUES
    (1, 1, NOW()),
    (2, 2, NOW()),
    (3, 3, NOW()),
    (4, 4, NOW());


-- =========================================
-- 5. ESTANTES (Status: Quero Ler, Lendo, Lido, Abandonado)
-- =========================================

INSERT INTO Estantes
    (IdUsuario, IdLivros, Status, DataAtualizacao)
VALUES
    (1, 1, 'Lido', NOW()),
    (1, 2, 'Lendo', NOW()),
    (1, 4, 'Quero Ler', NOW()),
    (2, 1, 'Quero Ler', NOW()),
    (2, 3, 'Lido', NOW()),
    (2, 4, 'Abandonado', NOW()),
    (3, 2, 'Lido', NOW());


-- =========================================
-- 6. REVIEWS COM AVALIAÇÃO DUPLA (1 a 5 estrelas)
-- =========================================

INSERT INTO Reviews
    (
        IdUsuario,
        IdLivro,
        IdAdaptacao,
        NotaLivro,
        NotaFidelidade,
        Comentario,
        AssistiuFilme,
        Nota,
        Voto,
        DataCriacao
    )
VALUES
    (
        1,
        1,
        1,
        5,
        4,
        'O livro O Hobbit é uma obra-prima leve e divertida. O filme expandiu bastante com elementos dos apêndices, mas manteve a essência mágica da Terra-média!',
        TRUE,
        5,
        'Recomendo',
        NOW()
    ),
    (
        2,
        2,
        2,
        5,
        5,
        'A adaptação de Harry Potter e a Pedra Filosofal é extremamente fiel ao livro! Chris Columbus conseguiu capturar a magia de Hogwarts com fidelidade impecável.',
        TRUE,
        5,
        'Excelente adaptação',
        NOW()
    ),
    (
        1,
        3,
        3,
        4,
        4,
        'Jogos Vorazes no cinema capturou a tensão do livro com maestria. A atuação de Jennifer Lawrence é incrível!',
        TRUE,
        4,
        'Muito bom',
        NOW()
    ),
    (
        3,
        4,
        4,
        5,
        5,
        'Duna de Denis Villeneuve é um espetáculo audiovisual que honra a densidade política e filosófica da obra de Frank Herbert.',
        TRUE,
        5,
        'Perfeito',
        NOW()
    );
