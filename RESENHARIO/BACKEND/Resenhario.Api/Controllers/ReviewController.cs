using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Resenhario.Api.Data;
using Resenhario.Api.Models;

namespace Resenhario.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReviewController(AppDbContext context) => _context = context;

    public record ReviewResposta(
        int IdReviews,
        int IdUsuario,
        string NomeUsuario,
        int? IdLivro,
        string? TituloLivro,
        string? CapaLivro,
        int? IdAdaptacao,
        string? TituloFilme,
        string? PosterFilme,
        int? NotaLivro,
        int? NotaFidelidade,
        string? Comentario,
        bool AssistiuFilme,
        DateTime DataCriacao
    );

    public record FeedDto(
        int TotalReviews,
        int TotalLivrosCadastrados,
        int TotalAdaptacoesCadastradas,
        IEnumerable<ReviewResposta> UltimasResenhas
    );

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReviewResposta>>> GetReviews(
        [FromQuery] int? livroId,
        [FromQuery] int? adaptacaoId,
        [FromQuery] int? usuarioId)
    {
        var query = from r in _context.Reviews
                    join u in _context.Usuarios on r.IdUsuario equals u.IdUsuario
                    join l0 in _context.Livros on r.IdLivro equals (int?)l0.IdLivros into livros
                    from l in livros.DefaultIfEmpty()
                    join a0 in _context.Adaptacoes on r.IdAdaptacao equals (int?)a0.IdAdaptacoes into adaptacoes
                    from a in adaptacoes.DefaultIfEmpty()
                    join f0 in _context.Filmes on a.IdFilme equals f0.IdFilme into filmes
                    from f in filmes.DefaultIfEmpty()
                    select new ReviewResposta(
                        r.IdReviews,
                        r.IdUsuario,
                        u.Nome,
                        r.IdLivro,
                        l != null ? l.Titulo : (a != null ? "Livro da Adaptação" : "Obra"),
                        l != null ? l.CapaUrl : null,
                        r.IdAdaptacao,
                        f != null ? f.Titulo : null,
                        f != null ? f.PosterUrl : null,
                        r.NotaLivro ?? r.Nota,
                        r.NotaFidelidade,
                        r.Comentario,
                        r.AssistiuFilme,
                        r.DataCriacao
                    );

        if (livroId.HasValue) query = query.Where(r => r.IdLivro == livroId.Value);
        if (adaptacaoId.HasValue) query = query.Where(r => r.IdAdaptacao == adaptacaoId.Value);
        if (usuarioId.HasValue) query = query.Where(r => r.IdUsuario == usuarioId.Value);

        return Ok(await query.OrderByDescending(r => r.DataCriacao).ToListAsync());
    }

    /// <summary>
    /// Feed social com estatísticas de leitura e as últimas resenhas da comunidade
    /// </summary>
    [HttpGet("feed")]
    public async Task<ActionResult<FeedDto>> GetFeed()
    {
        var totalReviews = await _context.Reviews.CountAsync();
        var totalLivros = await _context.Livros.CountAsync();
        var totalAdaptacoes = await _context.Adaptacoes.CountAsync();

        var ultimasResenhas = await (
            from r in _context.Reviews
            join u in _context.Usuarios on r.IdUsuario equals u.IdUsuario
            join l0 in _context.Livros on r.IdLivro equals (int?)l0.IdLivros into livros
            from l in livros.DefaultIfEmpty()
            join a0 in _context.Adaptacoes on r.IdAdaptacao equals (int?)a0.IdAdaptacoes into adaptacoes
            from a in adaptacoes.DefaultIfEmpty()
            join f0 in _context.Filmes on a.IdFilme equals f0.IdFilme into filmes
            from f in filmes.DefaultIfEmpty()
            orderby r.DataCriacao descending
            select new ReviewResposta(
                r.IdReviews,
                r.IdUsuario,
                u.Nome,
                r.IdLivro,
                l != null ? l.Titulo : "Obra",
                l != null ? l.CapaUrl : null,
                r.IdAdaptacao,
                f != null ? f.Titulo : null,
                f != null ? f.PosterUrl : null,
                r.NotaLivro ?? r.Nota,
                r.NotaFidelidade,
                r.Comentario,
                r.AssistiuFilme,
                r.DataCriacao
            )
        ).Take(15).ToListAsync();

        return Ok(new FeedDto(totalReviews, totalLivros, totalAdaptacoes, ultimasResenhas));
    }

    [HttpPost]
    public async Task<IActionResult> CriarReview([FromBody] Review review)
    {
        if (review.IdUsuario <= 0 || !await _context.Usuarios.AnyAsync(u => u.IdUsuario == review.IdUsuario))
            return BadRequest("Entre na sua conta antes de publicar.");

        if ((review.IdLivro is null || review.IdLivro <= 0) && (review.IdAdaptacao is null || review.IdAdaptacao <= 0))
            return BadRequest("Selecione um livro ou uma adaptação.");

        // Se informou apenas adaptação, recupera o livro vinculado
        if (review.IdAdaptacao.HasValue && (!review.IdLivro.HasValue || review.IdLivro <= 0))
        {
            var adp = await _context.Adaptacoes.FindAsync(review.IdAdaptacao.Value);
            if (adp != null) review.IdLivro = adp.IdLivro;
        }

        // Validação da nota da obra (1 a 5 estrelas conforme o escopo)
        var nota = review.NotaLivro ?? review.Nota;
        if (nota is null || nota < 1 || nota > 5)
            return BadRequest("A nota da obra deve ser de 1 a 5 estrelas.");

        // Validação da nota de fidelidade (1 a 5 estrelas se fornecida)
        if (review.NotaFidelidade.HasValue && (review.NotaFidelidade < 1 || review.NotaFidelidade > 5))
            return BadRequest("A nota de fidelidade da adaptação deve ser de 1 a 5 estrelas.");

        if (string.IsNullOrWhiteSpace(review.Comentario))
            return BadRequest("Escreva o comentário da sua resenha.");

        review.NotaLivro = nota;
        review.Nota = nota; // Compatibilidade com schema antigo
        review.DataCriacao = DateTime.Now;

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Resenha publicada com sucesso!", review.IdReviews });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletarReview(int id, [FromQuery] int usuarioId)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review is null) return NotFound();
        if (review.IdUsuario != usuarioId) return Forbid();

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
