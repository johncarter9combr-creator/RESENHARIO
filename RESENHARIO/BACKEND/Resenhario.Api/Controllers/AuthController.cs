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
            DataCadastro = DateTime.Now,
            // Hashing com BCrypt conforme especificado nos requisitos do projeto
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(dados.Senha)
        };

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

        bool senhaValida = false;
        try
        {
            // Validação com BCrypt
            senhaValida = BCrypt.Net.BCrypt.Verify(dados.Senha, usuario.SenhaHash);
        }
        catch (Exception)
        {
            // Compatibilidade: contas de teste antigas sem hash BCrypt válido
            return Unauthorized("Esta conta de teste não possui uma senha criptografada válida. Por favor, crie uma conta nova.");
        }

        if (!senhaValida)
            return Unauthorized("E-mail ou senha incorretos.");

        return Ok(new UsuarioResposta(usuario.IdUsuario, usuario.Nome, usuario.Email));
    }
}
