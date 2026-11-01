using System.Net.Http.Headers;
using System.Text.Json;

namespace Resenhario.Api.Services;

public class FilmeExternoDto
{
    public string TmdbId { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string? Diretor { get; set; }
    public int? AnoLancamento { get; set; }
    public string? PosterUrl { get; set; }
    public string? Sinopse { get; set; }
}

public class TmdbService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TmdbService> _logger;

    public TmdbService(HttpClient httpClient, IConfiguration configuration, ILogger<TmdbService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<List<FilmeExternoDto>> BuscarFilmesAsync(string termo)
    {
        var lista = new List<FilmeExternoDto>();
        if (string.IsNullOrWhiteSpace(termo)) return lista;

        try
        {
            var apiKey = _configuration["ExternalApis:TmdbApiKey"] ?? "993c12658a5e8ee79ef1c2deae773fc6";
            var bearerToken = _configuration["ExternalApis:TmdbBearerToken"];

            var query = Uri.EscapeDataString(termo.Trim());
            var url = $"https://api.themoviedb.org/3/search/movie?query={query}&language=pt-BR&include_adult=false&page=1";
            
            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                url += $"&api_key={apiKey}";
            }

            var request = new HttpRequestMessage(HttpMethod.Get, url);
            if (!string.IsNullOrWhiteSpace(bearerToken))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);
            }

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("TMDB API retornou status {StatusCode} na busca por '{Termo}'", response.StatusCode, termo);
                return lista;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("results", out var results) || results.ValueKind != JsonValueKind.Array)
            {
                return lista;
            }

            var filmesBrutos = new List<(int Id, string Titulo, string? PosterPath, string? ReleaseDate, string? Overview)>();
            foreach (var item in results.EnumerateArray().Take(12))
            {
                var id = item.GetProperty("id").GetInt32();
                var titulo = item.TryGetProperty("title", out var t) ? t.GetString() ?? "Sem título" : "Sem título";
                var poster = item.TryGetProperty("poster_path", out var p) ? p.GetString() : null;
                var releaseDate = item.TryGetProperty("release_date", out var r) ? r.GetString() : null;
                var overview = item.TryGetProperty("overview", out var o) ? o.GetString() : null;

                filmesBrutos.Add((id, titulo, poster, releaseDate, overview));
            }

            // Busca os diretores paralelamente para os primeiros resultados
            var tasks = filmesBrutos.Select(async f =>
            {
                var diretor = await ObterDiretorAsync(f.Id, apiKey, bearerToken);
                int? ano = null;
                if (!string.IsNullOrWhiteSpace(f.ReleaseDate) && f.ReleaseDate.Length >= 4 && int.TryParse(f.ReleaseDate[..4], out var parsedYear))
                {
                    ano = parsedYear;
                }

                return new FilmeExternoDto
                {
                    TmdbId = f.Id.ToString(),
                    Titulo = f.Titulo,
                    Diretor = diretor,
                    AnoLancamento = ano,
                    PosterUrl = !string.IsNullOrWhiteSpace(f.PosterPath) ? $"https://image.tmdb.org/t/p/w500{f.PosterPath}" : null,
                    Sinopse = f.Overview
                };
            });

            var resultados = await Task.WhenAll(tasks);
            lista.AddRange(resultados);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao consultar TMDB API para o termo {Termo}", termo);
        }

        return lista;
    }

    private async Task<string?> ObterDiretorAsync(int movieId, string? apiKey, string? bearerToken)
    {
        try
        {
            var creditsUrl = $"https://api.themoviedb.org/3/movie/{movieId}/credits?language=pt-BR";
            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                creditsUrl += $"&api_key={apiKey}";
            }

            var request = new HttpRequestMessage(HttpMethod.Get, creditsUrl);
            if (!string.IsNullOrWhiteSpace(bearerToken))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);
            }

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("crew", out var crew) && crew.ValueKind == JsonValueKind.Array)
            {
                foreach (var member in crew.EnumerateArray())
                {
                    if (member.TryGetProperty("job", out var job) && job.GetString() == "Director")
                    {
                        return member.TryGetProperty("name", out var name) ? name.GetString() : null;
                    }
                }
            }
        }
        catch
        {
            // Silencioso se não conseguir o diretor
        }

        return null;
    }
}

