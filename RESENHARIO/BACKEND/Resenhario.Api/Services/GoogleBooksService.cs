using System.Text.Json;
using System.Text.Json.Serialization;

namespace Resenhario.Api.Services;

public class LivroExternoDto
{
    public string Id { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Autor { get; set; } = string.Empty;
    public string? Sinopse { get; set; }
    public string? Isbn { get; set; }
    public string? CapaUrl { get; set; }
    public string? AnoPublicacao { get; set; }
}

public class GoogleBooksService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleBooksService> _logger;

    public GoogleBooksService(HttpClient httpClient, IConfiguration configuration, ILogger<GoogleBooksService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<List<LivroExternoDto>> BuscarLivrosAsync(string termo)
    {
        var lista = new List<LivroExternoDto>();
        if (string.IsNullOrWhiteSpace(termo)) return lista;

        try
        {
            var apiKey = _configuration["ExternalApis:GoogleBooksApiKey"];
            var query = Uri.EscapeDataString(termo.Trim());
            var url = $"https://www.googleapis.com/books/v1/volumes?q={query}&maxResults=15";
            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                url += $"&key={apiKey}";
            }

            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Google Books API retornou código {StatusCode}", response.StatusCode);
                return lista;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("items", out var items) || items.ValueKind != JsonValueKind.Array)
            {
                return lista;
            }

            foreach (var item in items.EnumerateArray())
            {
                var id = item.GetProperty("id").GetString() ?? string.Empty;
                if (!item.TryGetProperty("volumeInfo", out var info)) continue;

                var titulo = info.TryGetProperty("title", out var titleProp) ? titleProp.GetString() : "Título não informado";
                
                var autores = "Autor não informado";
                if (info.TryGetProperty("authors", out var authorsProp) && authorsProp.ValueKind == JsonValueKind.Array)
                {
                    var autoresList = authorsProp.EnumerateArray()
                        .Select(a => a.GetString())
                        .Where(a => !string.IsNullOrWhiteSpace(a))
                        .ToList();
                    if (autoresList.Count > 0)
                    {
                        autores = string.Join(", ", autoresList);
                    }
                }

                string? sinopse = null;
                if (info.TryGetProperty("description", out var descProp))
                {
                    sinopse = descProp.GetString();
                }

                string? isbn = null;
                if (info.TryGetProperty("industryIdentifiers", out var identifiersProp) && identifiersProp.ValueKind == JsonValueKind.Array)
                {
                    foreach (var idObj in identifiersProp.EnumerateArray())
                    {
                        if (idObj.TryGetProperty("identifier", out var idVal))
                        {
                            isbn = idVal.GetString();
                            break;
                        }
                    }
                }

                string? capaUrl = null;
                if (info.TryGetProperty("imageLinks", out var imagesProp))
                {
                    if (imagesProp.TryGetProperty("thumbnail", out var thumbProp))
                    {
                        capaUrl = thumbProp.GetString();
                    }
                    else if (imagesProp.TryGetProperty("smallThumbnail", out var smallProp))
                    {
                        capaUrl = smallProp.GetString();
                    }

                    if (!string.IsNullOrEmpty(capaUrl) && capaUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase))
                    {
                        capaUrl = "https://" + capaUrl.Substring(7);
                    }
                }

                string? ano = null;
                if (info.TryGetProperty("publishedDate", out var pubDateProp))
                {
                    var pubDate = pubDateProp.GetString();
                    if (!string.IsNullOrWhiteSpace(pubDate) && pubDate.Length >= 4)
                    {
                        ano = pubDate.Substring(0, 4);
                    }
                }

                lista.Add(new LivroExternoDto
                {
                    Id = id,
                    Titulo = titulo ?? "Sem título",
                    Autor = autores,
                    Sinopse = sinopse,
                    Isbn = isbn,
                    CapaUrl = capaUrl,
                    AnoPublicacao = ano
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao consultar Google Books API para o termo {Termo}", termo);
        }

        return lista;
    }
}

