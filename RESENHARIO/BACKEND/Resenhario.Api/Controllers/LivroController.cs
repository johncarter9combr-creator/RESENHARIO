using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Resenhario.Api.Data;
using Resenhario.Api.Models;
using Resenhario.Api.Services;

namespace Resenhario.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LivroController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly GoogleBooksService _googleBooksService;

    public LivroController(AppDbContext context, GoogleBooksService googleBooksService)
    {
        _context = context;
        _googleBooksService = googleBooksService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Livro>>> GetLivros()
    {
        return Ok(await _context.Livros.OrderBy(l => l.Titulo).ToListAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Livro>> GetLivroPorId(int id)
    {
        var livro = await _context.Livros.FindAsync(id);
        if (livro == null) return NotFound();
        return Ok(livro);
    }

    /// <summary>
    /// Consulta livros diretamente na Google Books API
    /// </summary>
    [HttpGet("buscar-externo")]
    public async Task<IActionResult> BuscarGoogleBooks([FromQuery] string termo)
    {
        if (string.IsNullOrWhiteSpace(termo))
            return BadRequest("Informe um termo para a busca.");

        var resultados = await _googleBooksService.BuscarLivrosAsync(termo);
        return Ok(resultados);
    }

    [HttpPost]
    public async Task<IActionResult> CriarLivro(Livro livro)
    {
        if (string.IsNullOrWhiteSpace(livro.Titulo))
            return BadRequest("O título do livro é obrigatório.");

        // Verifica se o livro já foi cadastrado por GoogleBId ou ISBN ou Título
        Livro? existente = null;

        if (!string.IsNullOrWhiteSpace(livro.GoogleBId))
        {
            existente = await _context.Livros.FirstOrDefaultAsync(l => l.GoogleBId == livro.GoogleBId);
        }

        if (existente == null && !string.IsNullOrWhiteSpace(livro.Isbn))
        {
            existente = await _context.Livros.FirstOrDefaultAsync(l => l.Isbn == livro.Isbn);
        }

        if (existente == null)
        {
            var tituloTrim = livro.Titulo.Trim().ToLower();
            var autorTrim = (livro.Autor ?? "").Trim().ToLower();
            existente = await _context.Livros.FirstOrDefaultAsync(l =>
                l.Titulo.ToLower() == tituloTrim && (string.IsNullOrEmpty(autorTrim) || l.Autor.ToLower() == autorTrim));
        }

        if (existente != null)
        {
            return Ok(existente);
        }

        livro.Titulo = livro.Titulo.Trim();
        livro.Autor = string.IsNullOrWhiteSpace(livro.Autor) ? "Autor não informado" : livro.Autor.Trim();
        _context.Livros.Add(livro);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetLivroPorId), new { id = livro.IdLivros }, livro);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> AtualizarLivro(int id, Livro livro)
    {
        var livroExistente = await _context.Livros.FindAsync(id);
        if (livroExistente == null) return NotFound();

        livroExistente.GoogleBId = livro.GoogleBId;
        livroExistente.Titulo = livro.Titulo;
        livroExistente.Autor = livro.Autor;
        livroExistente.Sinopse = livro.Sinopse;
        livroExistente.Isbn = livro.Isbn;
        livroExistente.CapaUrl = livro.CapaUrl;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletarLivro(int id)
    {
        var livro = await _context.Livros.FindAsync(id);
        if (livro == null) return NotFound();

        _context.Livros.Remove(livro);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
