CREATE DATABASE IF NOT EXISTS resenhario_db;

USE resenhario_db;

DROP TABLE IF EXISTS Reviews;
DROP TABLE IF EXISTS Estantes;
DROP TABLE IF EXISTS Adaptacoes;
DROP TABLE IF EXISTS Filmes;
DROP TABLE IF EXISTS Livros;
DROP TABLE IF EXISTS Usuarios;

CREATE TABLE Usuarios (
    IdUsuario INT AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(150) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    SenhaHash VARCHAR(255) NOT NULL,
    DataCadastro DATETIME NOT NULL
);

CREATE TABLE Livros (
    IdLivros INT AUTO_INCREMENT PRIMARY KEY,
    GoogleBId VARCHAR(100),
    Titulo VARCHAR(200) NOT NULL,
    Autor VARCHAR(150) NOT NULL,
    Sinopse TEXT,
    Isbn VARCHAR(50),
    CapaUrl VARCHAR(500)
);

CREATE TABLE Filmes (
    IdFilme INT AUTO_INCREMENT PRIMARY KEY,
    TmdbId VARCHAR(100),
    Titulo VARCHAR(200) NOT NULL,
    Diretor VARCHAR(150),
    AnoLancamento INT,
    PosterUrl VARCHAR(500)
);

CREATE TABLE Adaptacoes (
    IdAdaptacoes INT AUTO_INCREMENT PRIMARY KEY,
    IdLivro INT NOT NULL,
    IdFilme INT NOT NULL,
    DataVinculo DATETIME NOT NULL,

    FOREIGN KEY (IdLivro)
        REFERENCES Livros(IdLivros) ON DELETE CASCADE,

    FOREIGN KEY (IdFilme)
        REFERENCES Filmes(IdFilme) ON DELETE CASCADE
);

CREATE TABLE Estantes (
    IdEstante INT AUTO_INCREMENT PRIMARY KEY,
    IdUsuario INT NOT NULL,
    IdLivros INT NULL,
    IdFilme INT NULL,
    IdSerie INT NULL,
    Status VARCHAR(50) NOT NULL,
    DataAtualizacao DATETIME NOT NULL,

    FOREIGN KEY (IdUsuario)
        REFERENCES Usuarios(IdUsuario) ON DELETE CASCADE,

    FOREIGN KEY (IdLivros)
        REFERENCES Livros(IdLivros) ON DELETE CASCADE
);

CREATE TABLE Reviews (
    IdReviews INT AUTO_INCREMENT PRIMARY KEY,

    IdUsuario INT NOT NULL,
    IdLivro INT NULL,
    IdAdaptacao INT NULL,

    NotaLivro INT NULL, -- Avaliação da obra literária (1 a 5 estrelas)
    NotaFidelidade INT NULL, -- Avaliação de fidelidade da adaptação cinematográfica (1 a 5 estrelas)
    Comentario TEXT NULL,
    AssistiuFilme BOOLEAN NOT NULL DEFAULT 0,
    Nota INT NULL,
    Voto VARCHAR(50) NULL,
    DataCriacao DATETIME NOT NULL,

    FOREIGN KEY (IdUsuario)
        REFERENCES Usuarios(IdUsuario) ON DELETE CASCADE,

    FOREIGN KEY (IdLivro)
        REFERENCES Livros(IdLivros) ON DELETE CASCADE,

    FOREIGN KEY (IdAdaptacao)
        REFERENCES Adaptacoes(IdAdaptacoes) ON DELETE CASCADE
);
