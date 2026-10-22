using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Resenhario.Api.Data;
using Resenhario.Api.Models;

namespace Resenhario.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SerieController : ControllerBase
{
    private readonly AppDbContext _context;
    public SerieController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Serie>>> GetSeries() =>
        Ok(await _context.Series.OrderBy(s => s.Titulo).ToListAsync());

    [HttpPost]
    public async Task<ActionResult<Serie>> CriarSerie(Serie serie)
    {
        if (string.IsNullOrWhiteSpace(serie.Titulo)) return BadRequest("O título é obrigatório.");
        var existente = await _context.Series.FirstOrDefaultAsync(s =>
            (!string.IsNullOrEmpty(serie.FonteId) && s.FonteId == serie.FonteId) ||
            s.Titulo.ToLower() == serie.Titulo.Trim().ToLower());
        if (existente != null) return Ok(existente);
        serie.Titulo = serie.Titulo.Trim();
        _context.Series.Add(serie);
        await _context.SaveChangesAsync();
        return Ok(serie);
    }
}
