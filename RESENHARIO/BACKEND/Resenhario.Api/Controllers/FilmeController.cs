using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Resenhario.Api.Data;
using Resenhario.Api.Models;
using Resenhario.Api.Services;

namespace Resenhario.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FilmeController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly TmdbService _tmdbService;

    public FilmeController(AppDbContext context, TmdbService tmdbService)
    {
        _context = context;
        _tmdbService = tmdbService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Filme>>> GetFilmes() =>
        Ok(await _context.Filmes.OrderBy(f => f.Titulo).ToListAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Filme>> GetFilmePorId(int id)
    {
        var filme = await _context.Filmes.FindAsync(id);
        if (filme == null) return NotFound();
        return Ok(filme);
    }

    /// <summary>
    /// Consulta filmes e diretores diretamente na The Movie Database (TMDB) API
    /// </summary>
    [HttpGet("buscar-externo")]
    public async Task<IActionResult> BuscarTmdb([FromQuery] string termo)
    {
        if (string.IsNullOrWhiteSpace(termo))
            return BadRequest("Informe o nome do filme para buscar.");

        var resultados = await _tmdbService.BuscarFilmesAsync(termo);
        return Ok(resultados);
    }

    [HttpPost]
    public async Task<ActionResult<Filme>> CriarFilme(Filme filme)
    {
        if (string.IsNullOrWhiteSpace(filme.Titulo)) return BadRequest("O título é obrigatório.");
        var titulo = filme.Titulo.Trim();
        var existente = await _context.Filmes.FirstOrDefaultAsync(f =>
            (!string.IsNullOrEmpty(f.TmdbId) && f.TmdbId == filme.TmdbId) ||
            f.Titulo.ToLower() == titulo.ToLower());
        if (existente != null) return Ok(existente);

        filme.Titulo = titulo;
        _context.Filmes.Add(filme);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetFilmePorId), new { id = filme.IdFilme }, filme);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletarFilme(int id)
    {
        var filme = await _context.Filmes.FindAsync(id);
        if (filme == null) return NotFound();
        _context.Filmes.Remove(filme);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
