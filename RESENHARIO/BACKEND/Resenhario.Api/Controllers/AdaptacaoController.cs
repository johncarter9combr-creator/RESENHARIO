using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Resenhario.Api.Data;
using Resenhario.Api.Models;

namespace Resenhario.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdaptacaoController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdaptacaoController(AppDbContext context)
    {
        _context = context;
    }

    public record AdaptacaoItemDto(
        int IdAdaptacoes,
        int IdLivro,
        string TituloLivro,
        string AutorLivro,
        string? CapaLivro,
        int IdFilme,
        string TituloFilme,
        string? DiretorFilme,
        int? AnoLancamentoFilme,
        string? PosterFilme,
        double? MediaFidelidade,
        double? MediaNotaLivro,
        int TotalAvaliacoes,
        DateTime DataVinculo
    );

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AdaptacaoItemDto>>> GetAdaptacoes()
    {
        var adaptacoes = await (
            from a in _context.Adaptacoes
            join l in _context.Livros on a.IdLivro equals l.IdLivros
            join f in _context.Filmes on a.IdFilme equals f.IdFilme
            select new
            {
                a.IdAdaptacoes,
                a.IdLivro,
                TituloLivro = l.Titulo,
                AutorLivro = l.Autor,
                CapaLivro = l.CapaUrl,
                a.IdFilme,
                TituloFilme = f.Titulo,
                DiretorFilme = f.Diretor,
                AnoLancamentoFilme = f.AnoLancamento,
                PosterFilme = f.PosterUrl,
                a.DataVinculo
            }
        ).ToListAsync();

        var reviews = await _context.Reviews
            .Where(r => r.IdAdaptacao != null)
            .ToListAsync();

        var resultado = adaptacoes.Select(a =>
        {
            var reviewsAdaptacao = reviews.Where(r => r.IdAdaptacao == a.IdAdaptacoes).ToList();
            var reviewsFidelidade = reviewsAdaptacao.Where(r => r.NotaFidelidade.HasValue).ToList();
            var reviewsLivro = reviewsAdaptacao.Where(r => r.NotaLivro.HasValue).ToList();

            double? mediaFidelidade = reviewsFidelidade.Count > 0
                ? Math.Round(reviewsFidelidade.Average(r => r.NotaFidelidade!.Value), 1)
                : null;

            double? mediaLivro = reviewsLivro.Count > 0
                ? Math.Round(reviewsLivro.Average(r => r.NotaLivro!.Value), 1)
                : null;

            return new AdaptacaoItemDto(
                a.IdAdaptacoes,
                a.IdLivro,
                a.TituloLivro,
                a.AutorLivro,
                a.CapaLivro,
                a.IdFilme,
                a.TituloFilme,
                a.DiretorFilme,
                a.AnoLancamentoFilme,
                a.PosterFilme,
                mediaFidelidade,
                mediaLivro,
                reviewsAdaptacao.Count,
                a.DataVinculo
            );
        }).OrderByDescending(a => a.TotalAvaliacoes).ToList();

        return Ok(resultado);
    }

    /// <summary>
    /// Ranking das melhores adaptações com base na avaliação de fidelidade (1 a 5 estrelas)
    /// </summary>
    [HttpGet("ranking")]
    public async Task<ActionResult<IEnumerable<AdaptacaoItemDto>>> GetRanking()
    {
        var adaptacoesResponse = await GetAdaptacoes();
        if (adaptacoesResponse.Result is OkObjectResult ok && ok.Value is List<AdaptacaoItemDto> lista)
        {
            var ordenado = lista
                .OrderByDescending(a => a.MediaFidelidade ?? 0)
                .ThenByDescending(a => a.TotalAvaliacoes)
                .ToList();
            return Ok(ordenado);
        }

        return Ok(new List<AdaptacaoItemDto>());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AdaptacaoItemDto>> GetAdaptacaoPorId(int id)
    {
        var item = await (
            from a in _context.Adaptacoes
            where a.IdAdaptacoes == id
            join l in _context.Livros on a.IdLivro equals l.IdLivros
            join f in _context.Filmes on a.IdFilme equals f.IdFilme
            select new
            {
                a.IdAdaptacoes,
                a.IdLivro,
                TituloLivro = l.Titulo,
                AutorLivro = l.Autor,
                CapaLivro = l.CapaUrl,
                a.IdFilme,
                TituloFilme = f.Titulo,
                DiretorFilme = f.Diretor,
                AnoLancamentoFilme = f.AnoLancamento,
                PosterFilme = f.PosterUrl,
                a.DataVinculo
            }
        ).FirstOrDefaultAsync();

        if (item == null) return NotFound();

        var reviews = await _context.Reviews.Where(r => r.IdAdaptacao == id).ToListAsync();
        var reviewsFidelidade = reviews.Where(r => r.NotaFidelidade.HasValue).ToList();
        var reviewsLivro = reviews.Where(r => r.NotaLivro.HasValue).ToList();

        double? mediaFidelidade = reviewsFidelidade.Count > 0
            ? Math.Round(reviewsFidelidade.Average(r => r.NotaFidelidade!.Value), 1)
            : null;

        double? mediaLivro = reviewsLivro.Count > 0
            ? Math.Round(reviewsLivro.Average(r => r.NotaLivro!.Value), 1)
            : null;

        return Ok(new AdaptacaoItemDto(
            item.IdAdaptacoes,
            item.IdLivro,
            item.TituloLivro,
            item.AutorLivro,
            item.CapaLivro,
            item.IdFilme,
            item.TituloFilme,
            item.DiretorFilme,
            item.AnoLancamentoFilme,
            item.PosterFilme,
            mediaFidelidade,
            mediaLivro,
            reviews.Count,
            item.DataVinculo
        ));
    }

    [HttpPost]
    public async Task<IActionResult> CriarAdaptacao(Adaptacao adaptacao)
    {
        if (adaptacao.IdLivro <= 0 || !await _context.Livros.AnyAsync(l => l.IdLivros == adaptacao.IdLivro))
            return BadRequest("Selecione um livro válido.");

        if (adaptacao.IdFilme <= 0 || !await _context.Filmes.AnyAsync(f => f.IdFilme == adaptacao.IdFilme))
            return BadRequest("Selecione um filme válido.");

        var existente = await _context.Adaptacoes.FirstOrDefaultAsync(a =>
            a.IdLivro == adaptacao.IdLivro && a.IdFilme == adaptacao.IdFilme);
        if (existente != null)
            return Ok(existente);

        adaptacao.DataVinculo = DateTime.Now;
        _context.Adaptacoes.Add(adaptacao);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAdaptacaoPorId), new { id = adaptacao.IdAdaptacoes }, adaptacao);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletarAdaptacao(int id)
    {
        var adaptacao = await _context.Adaptacoes.FindAsync(id);
        if (adaptacao == null) return NotFound();

        _context.Adaptacoes.Remove(adaptacao);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
