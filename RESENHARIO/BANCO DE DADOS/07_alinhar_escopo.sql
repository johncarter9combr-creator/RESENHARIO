USE resenhario_db;

-- Script de alinhamento com o escopo do projeto
-- Adiciona a coluna NotaFidelidade (1 a 5 estrelas) na tabela Reviews se ela ainda não existir

SET @col_fidelidade = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Reviews' AND COLUMN_NAME = 'NotaFidelidade'
);
SET @sql_fidelidade = IF(@col_fidelidade = 0,
    'ALTER TABLE Reviews ADD COLUMN NotaFidelidade INT NULL AFTER NotaLivro',
    'SELECT ''NotaFidelidade já existe'' AS aviso');
PREPARE stmt_fidelidade FROM @sql_fidelidade;
EXECUTE stmt_fidelidade;
DEALLOCATE PREPARE stmt_fidelidade;

-- Ajusta o tamanho da coluna TmdbId em Filmes caso necessário
ALTER TABLE Filmes MODIFY COLUMN TmdbId VARCHAR(100) NULL;

-- Garante que IdLivros em Estantes aceita NULL (para acomodar itens audiovisuais)
ALTER TABLE Estantes MODIFY COLUMN IdLivros INT NULL;

SELECT 'Banco de dados atualizado com sucesso para o escopo do Resenhário!' AS status;

