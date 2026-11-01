using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Resenhario.Api.Models;

[Table("Reviews")]
public class Review
{
    [Key]
    public int IdReviews { get; set; }

    public int IdUsuario { get; set; }
    public int? IdLivro { get; set; }
    public int? IdAdaptacao { get; set; }

    /// <summary>
    /// Nota dada ao livro (1 a 5 estrelas)
    /// </summary>
    public int? NotaLivro { get; set; }

    /// <summary>
    /// Avaliação comparativa da fidelidade da adaptação cinematográfica (1 a 5 estrelas)
    /// </summary>
    public int? NotaFidelidade { get; set; }

    public string? Comentario { get; set; }
    public bool AssistiuFilme { get; set; }
    public int? Nota { get; set; }
    public string? Voto { get; set; }
    public DateTime DataCriacao { get; set; }
}
