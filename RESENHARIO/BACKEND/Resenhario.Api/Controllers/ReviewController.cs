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

    public record ReviewResposta(int IdReviews, int IdUsuario, string NomeUsuario,
        int? IdLivro, string? Titulo, int? NotaLivro, string? Comentario, DateTime DataCriacao);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReviewResposta>>> GetReviews()
    {
        var resultado = await (from r in _context.Reviews
            join u in _context.Usuarios on r.IdUsuario equals u.IdUsuario
            join l0 in _context.Livros on r.IdLivro equals (int?)l0.IdLivros into livros
            from l in livros.DefaultIfEmpty()
            orderby r.DataCriacao descending
            select new ReviewResposta(r.IdReviews, r.IdUsuario, u.Nome, r.IdLivro,
                l != null ? l.Titulo : "Obra", r.NotaLivro ?? r.Nota, r.Comentario, r.DataCriacao))
            .ToListAsync();
        return Ok(resultado);
    }

    [HttpPost]
    public async Task<IActionResult> CriarReview(Review review)
    {
        if (review.IdUsuario <= 0 || !await _context.Usuarios.AnyAsync(u => u.IdUsuario == review.IdUsuario))
            return BadRequest("Entre na sua conta antes de publicar.");
        if (review.IdLivro is null || !await _context.Livros.AnyAsync(l => l.IdLivros == review.IdLivro))
            return BadRequest("Selecione um livro válido.");
        var nota = review.NotaLivro ?? review.Nota;
        if (nota is null || nota < 0 || nota > 10) return BadRequest("A nota deve estar entre 0 e 10.");
        if (string.IsNullOrWhiteSpace(review.Comentario)) return BadRequest("Escreva sua resenha.");
        review.NotaLivro = nota;
        review.AssistiuFilme = false;
        review.Nota = null;
        review.Voto = null;
        review.IdAdaptacao = null;
        review.DataCriacao = DateTime.Now;
        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();
        return Ok(new { mensagem = "Resenha publicada.", review.IdReviews });
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
