using Microsoft.AspNetCore.Mvc;
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

    [HttpGet]
    public ActionResult<IEnumerable<Adaptacao>> GetAdaptacoes()
    {
        return Ok(_context.Adaptacoes.ToList());
    }

    [HttpPost]
    public ActionResult<Adaptacao> CriarAdaptacao(Adaptacao adaptacao)
    {
        adaptacao.DataVinculo = DateTime.Now;

        _context.Adaptacoes.Add(adaptacao);
        _context.SaveChanges();

        return CreatedAtAction(
            nameof(GetAdaptacoes),
            new { id = adaptacao.IdAdaptacoes },
            adaptacao
        );
    }

    [HttpPut("{id}")]
    public IActionResult AtualizarAdaptacao(int id, Adaptacao adaptacao)
    {
        var adaptacaoExistente = _context.Adaptacoes.Find(id);

        if (adaptacaoExistente == null)
        {
            return NotFound();
        }

        adaptacaoExistente.IdLivro = adaptacao.IdLivro;
        adaptacaoExistente.IdFilme = adaptacao.IdFilme;

        _context.SaveChanges();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult DeletarAdaptacao(int id)
    {
        var adaptacao = _context.Adaptacoes.Find(id);

        if (adaptacao == null)
        {
            return NotFound();
        }

        _context.Adaptacoes.Remove(adaptacao);
        _context.SaveChanges();

        return NoContent();
    }
}

