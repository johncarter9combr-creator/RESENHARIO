using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Resenhario.Api.Data;
using Resenhario.Api.Models;

namespace Resenhario.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsuarioController : ControllerBase
{
    private readonly AppDbContext _context;
    public UsuarioController(AppDbContext context) => _context = context;

    public record UsuarioPublico(int IdUsuario, string Nome, string Email);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UsuarioPublico>>> GetUsuarios()
    {
        return Ok(await _context.Usuarios
            .Select(u => new UsuarioPublico(u.IdUsuario, u.Nome, u.Email))
            .ToListAsync());
    }

    [HttpPost]
    public async Task<IActionResult> CriarUsuario(Usuario usuario)
    {
        if (string.IsNullOrWhiteSpace(usuario.Nome) ||
            string.IsNullOrWhiteSpace(usuario.Email) ||
            string.IsNullOrWhiteSpace(usuario.SenhaHash))
            return BadRequest("Nome, e-mail e senha são obrigatórios.");

        if (await _context.Usuarios.AnyAsync(u => u.Email == usuario.Email))
            return Conflict("Já existe uma conta com esse e-mail.");

        usuario.DataCadastro = DateTime.Now;
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetUsuarios),
            new { id = usuario.IdUsuario },
            new UsuarioPublico(usuario.IdUsuario, usuario.Nome, usuario.Email));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> AtualizarUsuario(int id, Usuario usuario)
    {
        var atual = await _context.Usuarios.FindAsync(id);
        if (atual == null) return NotFound();
        atual.Nome = usuario.Nome;
        atual.Email = usuario.Email;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletarUsuario(int id)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null) return NotFound();
        _context.Usuarios.Remove(usuario);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
