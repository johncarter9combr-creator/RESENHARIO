using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Resenhario.Api.Data;
using Resenhario.Api.Models;

namespace Resenhario.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly PasswordHasher<Usuario> _hasher = new();

    public AuthController(AppDbContext context) => _context = context;

    public record CadastroRequest(string Nome, string Email, string Senha);
    public record LoginRequest(string Email, string Senha);
    public record UsuarioResposta(int IdUsuario, string Nome, string Email);

    [HttpPost("cadastro")]
    public async Task<IActionResult> Cadastro(CadastroRequest dados)
    {
        if (string.IsNullOrWhiteSpace(dados.Nome) ||
            string.IsNullOrWhiteSpace(dados.Email) ||
            string.IsNullOrWhiteSpace(dados.Senha) || dados.Senha.Length < 6)
            return BadRequest("Informe nome, e-mail e senha com pelo menos 6 caracteres.");

        var email = dados.Email.Trim().ToLowerInvariant();
        if (await _context.Usuarios.AnyAsync(u => u.Email.ToLower() == email))
            return Conflict("Já existe uma conta com esse e-mail.");

        var usuario = new Usuario
        {
            Nome = dados.Nome.Trim(),
            Email = email,
            DataCadastro = DateTime.Now
        };
        usuario.SenhaHash = _hasher.HashPassword(usuario, dados.Senha);
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        return Ok(new UsuarioResposta(usuario.IdUsuario, usuario.Nome, usuario.Email));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest dados)
    {
        var email = dados.Email.Trim().ToLowerInvariant();
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
        if (usuario == null)
            return Unauthorized("E-mail ou senha incorretos.");

        PasswordVerificationResult resultado;
        try
        {
            resultado = _hasher.VerifyHashedPassword(usuario, usuario.SenhaHash, dados.Senha);
        }
        catch (Exception ex) when (ex is FormatException or ArgumentException)
        {
            // Os usuários de teste antigos possuem valores fictícios, não hashes reais.
            return Unauthorized("Esta conta de teste não possui uma senha válida. Crie uma conta nova.");
        }
        if (resultado == PasswordVerificationResult.Failed)
            return Unauthorized("E-mail ou senha incorretos.");

        return Ok(new UsuarioResposta(usuario.IdUsuario, usuario.Nome, usuario.Email));
    }
}
