// Example registration (Program.cs, ASP.NET Core 8+):
//
// builder.Services.AddHttpClient<Lighthouse.Ml.MlPredictionClient>((sp, client) =>
// {
//     var baseUrl = builder.Configuration["MlPython:BaseUrl"]
//         ?? throw new InvalidOperationException("MlPython:BaseUrl");
//     client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
//     client.Timeout = TimeSpan.FromSeconds(60);
// });
//
// Minimal API proxy (your React app calls https://your-api/... instead of Python directly):
//
// app.MapPost("/api/ml/dashboard/reintegration", async (
//     FeaturePayload body,
//     double threshold,
//     MlPredictionClient ml,
//     CancellationToken ct) =>
// {
//     // TODO: validate Supabase JWT from Authorization header and authorize user
//     return Results.Ok(await ml.DashboardReintegrationAsync(body, threshold, ct));
// }).RequireAuthorization();
//
// app.MapPost("/api/ml/dashboard/case-escalation", async (
//     FeaturePayload body,
//     double threshold,
//     MlPredictionClient ml,
//     CancellationToken ct) =>
// {
//     return Results.Ok(await ml.DashboardCaseEscalationAsync(body, threshold, ct));
// }).RequireAuthorization();
