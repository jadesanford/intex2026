using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace OpenArms.Api.Services;

public class SupabaseService
{
    private readonly HttpClient _http;
    private readonly string _baseUrl;
    private readonly ILogger<SupabaseService>? _logger;
    private static readonly JsonSerializerOptions _opts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    public SupabaseService(string supabaseUrl, string serviceRoleKey, ILogger<SupabaseService>? logger = null)
    {
        _baseUrl = supabaseUrl.TrimEnd('/');
        _logger = logger;
        _http = new HttpClient();
        _http.DefaultRequestHeaders.Add("apikey", serviceRoleKey);
        _http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", serviceRoleKey);
    }

    private HttpRequestMessage BuildRequest(HttpMethod method, string url, object? body = null)
    {
        var req = new HttpRequestMessage(method, url);
        if (body != null)
        {
            req.Content = new StringContent(
                JsonSerializer.Serialize(body, _opts),
                Encoding.UTF8,
                "application/json");
        }
        return req;
    }

    public async Task<List<T>> GetAllAsync<T>(string table, string query = "select=*")
    {
        try
        {
            var url = $"{_baseUrl}/rest/v1/{table}?{query}";
            var res = await _http.GetAsync(url);
            var json = await res.Content.ReadAsStringAsync();
            if (!res.IsSuccessStatusCode)
            {
                _logger?.LogWarning("Supabase GET {Table} failed ({Status}): {Body}", table, (int)res.StatusCode, json);
                return [];
            }
            return JsonSerializer.Deserialize<List<T>>(json, _opts) ?? [];
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error fetching {Table}", table);
            return [];
        }
    }

    public async Task<T?> GetOneAsync<T>(string table, string filter)
    {
        try
        {
            var url = $"{_baseUrl}/rest/v1/{table}?{filter}&limit=1";
            var res = await _http.GetAsync(url);
            var json = await res.Content.ReadAsStringAsync();
            if (!res.IsSuccessStatusCode)
            {
                _logger?.LogWarning("Supabase GET ONE {Table} failed ({Status}): {Body}", table, (int)res.StatusCode, json);
                return default;
            }
            var list = JsonSerializer.Deserialize<List<T>>(json, _opts);
            return list != null && list.Count > 0 ? list[0] : default;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error fetching one from {Table}", table);
            return default;
        }
    }

    public async Task<T?> InsertAsync<T>(string table, object body)
    {
        try
        {
            var req = BuildRequest(HttpMethod.Post, $"{_baseUrl}/rest/v1/{table}", body);
            req.Headers.Add("Prefer", "return=representation");
            var res = await _http.SendAsync(req);
            var json = await res.Content.ReadAsStringAsync();
            if (!res.IsSuccessStatusCode)
            {
                _logger?.LogWarning("Supabase INSERT {Table} failed ({Status}): {Body}", table, (int)res.StatusCode, json);
                return default;
            }
            var list = JsonSerializer.Deserialize<List<T>>(json, _opts);
            return list != null && list.Count > 0 ? list[0] : default;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error inserting into {Table}", table);
            return default;
        }
    }

    public async Task<T?> UpdateAsync<T>(string table, string filter, object body)
    {
        try
        {
            var req = BuildRequest(new HttpMethod("PATCH"), $"{_baseUrl}/rest/v1/{table}?{filter}", body);
            req.Headers.Add("Prefer", "return=representation");
            var res = await _http.SendAsync(req);
            var json = await res.Content.ReadAsStringAsync();
            if (!res.IsSuccessStatusCode)
            {
                _logger?.LogWarning("Supabase PATCH {Table} failed ({Status}): {Body}", table, (int)res.StatusCode, json);
                return default;
            }
            var list = JsonSerializer.Deserialize<List<T>>(json, _opts);
            return list != null && list.Count > 0 ? list[0] : default;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error updating {Table}", table);
            return default;
        }
    }

    public async Task<bool> DeleteAsync(string table, string filter)
    {
        try
        {
            var res = await _http.DeleteAsync($"{_baseUrl}/rest/v1/{table}?{filter}");
            return res.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error deleting from {Table}", table);
            return false;
        }
    }

    public async Task<string> RawGetAsync(string table, string query)
    {
        try
        {
            var url = $"{_baseUrl}/rest/v1/{table}?{query}";
            var res = await _http.GetAsync(url);
            return await res.Content.ReadAsStringAsync();
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error raw-fetching {Table}", table);
            return "[]";
        }
    }

    public async Task<bool> ExecuteSqlAsync(string sql)
    {
        try
        {
            var req = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/rest/v1/rpc/exec_sql");
            req.Content = new StringContent(
                JsonSerializer.Serialize(new { sql }),
                Encoding.UTF8, "application/json");
            var res = await _http.SendAsync(req);
            return res.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error executing SQL");
            return false;
        }
    }
}
