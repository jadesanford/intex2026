using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace OpenArms.Api.Services;

/// <summary>
/// Settings for the JWT session cookie. HttpOnly is always true so client-side scripts cannot read the token (XSS mitigation).
/// This mirrors the intent of ConfigureApplicationCookie in ASP.NET Identity; this API uses JWT + a manual auth cookie instead.
/// </summary>
public static class AuthSessionCookie
{
    public const string Name = "oa_access_token";

    private static SameSiteMode ResolveSameSite(
        IConfiguration configuration,
        IWebHostEnvironment env,
        HttpRequest request)
    {
        var configured = configuration["Jwt:CookieSameSite"];
        if (!string.IsNullOrWhiteSpace(configured) &&
            Enum.TryParse<SameSiteMode>(configured, true, out var explicitMode))
        {
            return explicitMode;
        }

        if (env.IsDevelopment())
        {
            // Local dev commonly runs the SPA and API on localhost with different ports; Lax works there
            // without requiring HTTPS-only cookies.
            return SameSiteMode.Lax;
        }

        var frontendBaseUrl = configuration["FrontendBaseUrl"];
        if (Uri.TryCreate(frontendBaseUrl, UriKind.Absolute, out var frontendUri))
        {
            var apiHost = request.Host.Host;
            if (!string.Equals(frontendUri.Host, apiHost, StringComparison.OrdinalIgnoreCase))
            {
                // Production SPA and API are deployed on different hosts, so auth has to travel cross-site.
                return SameSiteMode.None;
            }
        }

        return SameSiteMode.Lax;
    }

    public static CookieOptions CreateAppendOptions(
        IConfiguration configuration,
        IWebHostEnvironment env,
        HttpRequest request)
    {
        var expiryHours = int.Parse(configuration["Jwt:ExpiryHours"] ?? "168");
        var sameSite = ResolveSameSite(configuration, env, request);
        var secure = sameSite == SameSiteMode.None
            ? true
            : (!env.IsDevelopment() || request.IsHttps);

        return new CookieOptions
        {
            HttpOnly = true,
            Secure = secure,
            SameSite = sameSite,
            Path = "/",
            MaxAge = TimeSpan.FromHours(expiryHours)
        };
    }

    public static CookieOptions CreateDeleteOptions(
        IConfiguration configuration,
        IWebHostEnvironment env,
        HttpRequest request)
    {
        var sameSite = ResolveSameSite(configuration, env, request);
        var secure = sameSite == SameSiteMode.None
            ? true
            : (!env.IsDevelopment() || request.IsHttps);

        return new CookieOptions
        {
            Path = "/",
            HttpOnly = true,
            Secure = secure,
            SameSite = sameSite
        };
    }
}
