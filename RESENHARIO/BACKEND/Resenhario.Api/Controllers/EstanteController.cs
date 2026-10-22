using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Resenhario.Api.Data;
using Resenhario.Api.Models;

namespace Resenhario.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EstanteController : ControllerBase
{
    private readonly AppDbContext _context;
    public EstanteController(AppDbContext context) => _context = context;

    public record EstanteItem(int IdEstante, int IdUsuario, int? IdLivros, int? IdFilme,
        int? IdSerie, string Status, string? Titulo, string? Autor, string Tipo, DateTime DataAtualizacao);

    [HttpGet]
    public async Task<IActionResult> GetEstantes([FromQuery] int? usuarioId)
    {
        var query =
            from e in _context.Estantes
            join u in _context.Usuarios on e.IdUsuario equals u.IdUsuario
            join l0 in _context.Livros on e.IdLivros equals (int?)l0.IdLivros into livros
            from l in livros.DefaultIfEmpty()
            join f0 in _context.Filmes on e.IdFilme equals (int?)f0.IdFilme into filmes
            from f in filmes.DefaultIfEmpty()
            join s0 in _context.Series on e.IdSerie equals (int?)s0.IdSerie into series
            from s in series.DefaultIfEmpty()
            select new EstanteItem(e.IdEstante, e.IdUsuario, e.IdLivros, e.IdFilme, e.IdSerie,
                e.Status, l != null ? l.Titulo : f != null ? f.Titulo : s != null ? s.Titulo : "Item",
                l != null ? l.Autor : f != null ? f.Diretor : null,
                l != null ? "Livro" : f != null ? "Filme" : "Série", e.DataAtualizacao);

        if (usuarioId.HasValue) query = query.Where(e => e.IdUsuario == usuarioId.Value);
        return Ok(await query.OrderByDescending(e => e.DataAtualizacao).ToListAsync());
    }

    [HttpPost]
    public async Task<IActionResult> CriarEstante(Estante estante)
    {
        int tipos = (estante.IdLivros.HasValue ? 1 : 0) +
                    (estante.IdFilme.HasValue ? 1 : 0) +
                    (estante.IdSerie.HasValue ? 1 : 0);
        if (tipos != 1) return BadRequest("Informe exatamente um livro, filme ou série.");
        if (!await _context.Usuarios.AnyAsync(u => u.IdUsuario == estante.IdUsuario))
            return BadRequest("Usuário não encontrado.");

        bool duplicado = await _context.Estantes.AnyAsync(e =>
            e.IdUsuario == estante.IdUsuario &&
            e.IdLivros == estante.IdLivros &&
            e.IdFilme == estante.IdFilme &&
            e.IdSerie == estante.IdSerie);
        if (duplicado) return Conflict("Esse item já está na sua estante.");

        estante.DataAtualizacao = DateTime.Now;
        if (string.IsNullOrWhiteSpace(estante.Status)) estante.Status = "Quero ver";
        _context.Estantes.Add(estante);
        await _context.SaveChangesAsync();
        return Ok(new { mensagem = "Item adicionado à estante.", estante.IdEstante });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> AtualizarEstante(int id, [FromQuery] int usuarioId, [FromBody] AtualizarStatusRequest dados)
    {
        var estante = await _context.Estantes.FindAsync(id);
        if (estante == null) return NotFound();
        if (estante.IdUsuario != usuarioId) return Forbid();
        var statusValidos = new[] { "Quero ler", "Lendo", "Lido", "Quero ver", "Assistindo", "Assistido" };
        if (!statusValidos.Contains(dados.Status)) return BadRequest("Status inválido.");
        estante.Status = dados.Status;
        estante.DataAtualizacao = DateTime.Now;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    public record AtualizarStatusRequest(string Status);

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletarEstante(int id, [FromQuery] int usuarioId)
    {
        var item = await _context.Estantes.FindAsync(id);
        if (item == null) return NotFound();
        if (item.IdUsuario != usuarioId) return Forbid();
        _context.Estantes.Remove(item);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
