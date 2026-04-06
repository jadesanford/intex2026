using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace OpenArms.Api.Services;

public class SupabaseService
{
    private readonly HttpClient _http;
    private readonly string _baseUrl;
    private static readonly JsonSerializerOptions _opts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    public SupabaseService(string supabaseUrl, string serviceRoleKey)
    {
        _baseUrl = supabaseUrl.TrimEnd('/');
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
        var url = $"{_baseUrl}/rest/v1/{table}?{query}";
        var res = await _http.GetAsync(url);
        var json = await res.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<T>>(json, _opts) ?? [];
    }

    public async Task<T?> GetOneAsync<T>(string table, string filter)
    {
        var url = $"{_baseUrl}/rest/v1/{table}?{filter}&limit=1";
        var res = await _http.GetAsync(url);
        var json = await res.Content.ReadAsStringAsync();
        var list = JsonSerializer.Deserialize<List<T>>(json, _opts);
        return list != null && list.Count > 0 ? list[0] : default;
    }

    public async Task<T?> InsertAsync<T>(string table, object body)
    {
        var req = BuildRequest(HttpMethod.Post, $"{_baseUrl}/rest/v1/{table}", body);
        req.Headers.Add("Prefer", "return=representation");
        var res = await _http.SendAsync(req);
        var json = await res.Content.ReadAsStringAsync();
        var list = JsonSerializer.Deserialize<List<T>>(json, _opts);
        return list != null && list.Count > 0 ? list[0] : default;
    }

    public async Task<T?> UpdateAsync<T>(string table, string filter, object body)
    {
        var req = BuildRequest(new HttpMethod("PATCH"), $"{_baseUrl}/rest/v1/{table}?{filter}", body);
        req.Headers.Add("Prefer", "return=representation");
        var res = await _http.SendAsync(req);
        var json = await res.Content.ReadAsStringAsync();
        var list = JsonSerializer.Deserialize<List<T>>(json, _opts);
        return list != null && list.Count > 0 ? list[0] : default;
    }

    public async Task<bool> DeleteAsync(string table, string filter)
    {
        var res = await _http.DeleteAsync($"{_baseUrl}/rest/v1/{table}?{filter}");
        return res.IsSuccessStatusCode;
    }

    public async Task<string> RawGetAsync(string table, string query)
    {
        var url = $"{_baseUrl}/rest/v1/{table}?{query}";
        var res = await _http.GetAsync(url);
        return await res.Content.ReadAsStringAsync();
    }

    public async Task<bool> ExecuteSqlAsync(string sql)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/rest/v1/rpc/exec_sql");
        req.Content = new StringContent(
            JsonSerializer.Serialize(new { sql }),
            Encoding.UTF8, "application/json");
        var res = await _http.SendAsync(req);
        return res.IsSuccessStatusCode;
    }
}
