using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using OpenArms.Api.Services;

var builder = WebApplication.CreateBuilder(args);

var configuredPort = Environment.GetEnvironmentVariable("BACKEND_PORT")
    ?? Environment.GetEnvironmentVariable("PORT")
    ?? Environment.GetEnvironmentVariable("WEBSITES_PORT");
var iisAssignedPort = Environment.GetEnvironmentVariable("ASPNETCORE_PORT");
var aspNetCoreUrls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS");

if (string.IsNullOrWhiteSpace(iisAssignedPort) && string.IsNullOrWhiteSpace(aspNetCoreUrls))
{
    var port = configuredPort ?? "8082";
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

var supabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_URL")
    ?? builder.Configuration["Supabase:Url"] ?? "";
var supabaseKey = Environment.GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY")
    ?? builder.Configuration["Supabase:ServiceRoleKey"] ?? "";
var jwtKey = builder.Configuration["Jwt:Key"] ?? "OpenArms_SuperSecretKey_2024_MustBeAtLeast32CharsLong!";

builder.Services.AddSingleton(new SupabaseService(supabaseUrl, supabaseKey));
builder.Services.AddSingleton(new AuthService(jwtKey,
    builder.Configuration["Jwt:Issuer"] ?? "OpenArmsApi",
    builder.Configuration["Jwt:Audience"] ?? "OpenArmsClient",
    int.Parse(builder.Configuration["Jwt:ExpiryHours"] ?? "168")));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("InternalStaff", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            context.User.Claims.Any(claim =>
                claim.Type == ClaimTypes.Role &&
                (string.Equals(claim.Value?.Trim(), "admin", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(claim.Value?.Trim(), "staff", StringComparison.OrdinalIgnoreCase))));
    });

    options.AddPolicy("AdminOnly", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            context.User.Claims.Any(claim =>
                claim.Type == ClaimTypes.Role &&
                (string.Equals(claim.Value?.Trim(), "admin", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(claim.Value?.Trim(), "staff", StringComparison.OrdinalIgnoreCase))));
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "ok", timestamp = DateTime.UtcNow }));

app.Run();
