// HttpClient wrapper for the internal Python ML API. Register as a typed HttpClient in DI.
// appsettings.json: "MlPython": { "BaseUrl": "http://localhost:8000" }
//
// Security: bind the Python service to localhost / private network only; expose predictions
// through your ASP.NET API after validating the Supabase JWT (or your own auth).

using System.Net.Http.Json;
using System.Text.Json;
using Lighthouse.Ml.Contracts;

namespace Lighthouse.Ml;

public sealed class MlPredictionClient
{
    private readonly HttpClient _http;
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = false,
    };

    public MlPredictionClient(HttpClient http) => _http = http;

    public Task<MlHealthResponse> GetHealthAsync(CancellationToken ct = default) =>
        _http.GetFromJsonAsync<MlHealthResponse>("/health", JsonOpts, ct)!;

    public async Task<ReintegrationDashboardResponse> DashboardReintegrationAsync(
        FeaturePayload body,
        double threshold = 0.2,
        CancellationToken ct = default)
    {
        var q = $"?threshold={threshold.ToString(System.Globalization.CultureInfo.InvariantCulture)}";
        var res = await _http.PostAsJsonAsync("/dashboard/reintegration-readiness" + q, body, ct);
        res.EnsureSuccessStatusCode();
        return (await res.Content.ReadFromJsonAsync<ReintegrationDashboardResponse>(JsonOpts, ct))!;
    }

    public async Task<CaseEscalationDashboardResponse> DashboardCaseEscalationAsync(
        FeaturePayload body,
        double threshold = 0.5,
        CancellationToken ct = default)
    {
        var q = $"?threshold={threshold.ToString(System.Globalization.CultureInfo.InvariantCulture)}";
        var res = await _http.PostAsJsonAsync("/dashboard/case-escalation-risk" + q, body, ct);
        res.EnsureSuccessStatusCode();
        return (await res.Content.ReadFromJsonAsync<CaseEscalationDashboardResponse>(JsonOpts, ct))!;
    }
}
