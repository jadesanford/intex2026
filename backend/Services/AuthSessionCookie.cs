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

    public static CookieOptions CreateAppendOptions(
        IConfiguration configuration,
        IWebHostEnvironment env,
        HttpRequest request)
    {
        var expiryHours = int.Parse(configuration["Jwt:ExpiryHours"] ?? "168");
        var sameSiteStr = configuration["Jwt:CookieSameSite"] ?? "Lax";
        var sameSite = Enum.TryParse<SameSiteMode>(sameSiteStr, true, out var ss) ? ss : SameSiteMode.Lax;
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
        var sameSiteStr = configuration["Jwt:CookieSameSite"] ?? "Lax";
        var sameSite = Enum.TryParse<SameSiteMode>(sameSiteStr, true, out var ss) ? ss : SameSiteMode.Lax;
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
