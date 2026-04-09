using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenArms.Api;
using OpenArms.Api.Models;
using OpenArms.Api.Services;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(SupabaseService db, AuthService auth, IConfiguration configuration) : ControllerBase
{
    private static bool GoogleConfigured(IConfiguration cfg) =>
        !string.IsNullOrWhiteSpace(cfg["Authentication:Google:ClientId"]) &&
        !string.IsNullOrWhiteSpace(cfg["Authentication:Google:ClientSecret"]);

    private static string? EmailFromExternalPrincipal(ClaimsPrincipal user)
    {
        foreach (var c in user.Claims)
        {
            if (c.Type is ClaimTypes.Email or "email" or "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")
                return string.IsNullOrWhiteSpace(c.Value) ? null : c.Value.Trim();
        }
        return null;
    }

    /// <summary>Starts Google OAuth. Browser redirect only (not for fetch/XHR).</summary>
    [HttpGet("login-google")]
    [AllowAnonymous]
    public IActionResult LoginGoogle()
    {
        if (!GoogleConfigured(configuration))
            return BadRequest(new { message = "Google sign-in is not configured (missing ClientId/ClientSecret)." });

        var props = new AuthenticationProperties
        {
            RedirectUri = "/api/auth/google-complete",
        };
        return Challenge(props, GoogleDefaults.AuthenticationScheme);
    }

    /// <summary>After Google redirects to /signin-google, middleware signs in with ExternalCookie, then redirects here.</summary>
    [HttpGet("google-complete")]
    [Authorize(AuthenticationSchemes = AuthSchemes.ExternalCookie)]
    public async Task<IActionResult> GoogleComplete()
    {
        var frontend = (configuration["FrontendBaseUrl"] ?? "http://localhost:5173").TrimEnd('/');

        var email = EmailFromExternalPrincipal(User);
        if (string.IsNullOrEmpty(email))
        {
            await HttpContext.SignOutAsync(AuthSchemes.ExternalCookie);
            return Redirect($"{frontend}/login?error=google_no_email");
        }

        var user = await db.GetOneAsync<User>("users", $"email=eq.{Esc(email)}&select=*");
        if (user == null)
        {
            await HttpContext.SignOutAsync(AuthSchemes.ExternalCookie);
            return Redirect($"{frontend}/login?error=google_no_account");
        }

        if (user.IsActive == false)
        {
            await HttpContext.SignOutAsync(AuthSchemes.ExternalCookie);
            return Redirect($"{frontend}/login?error=google_inactive");
        }

        await HttpContext.SignOutAsync(AuthSchemes.ExternalCookie);

        var token = auth.GenerateToken(user);
        // Redirect to /#token= so the first request is GET / (always serves SPA). /auth/... deep links can 404 on some hosts.
        return Redirect($"{frontend}/#token={Uri.EscapeDataString(token)}");
    }
    private static string Esc(string value) => Uri.EscapeDataString(value);
    private static string? NormalizeRegion(string? region)
    {
        if (string.IsNullOrWhiteSpace(region)) return null;
        var r = region.Trim().ToLowerInvariant();
        if (r.Contains("mindanao")) return "Mindanao";
        if (r.Contains("visayas")) return "Visayas";
        if (r.Contains("luzon") || r.Contains("ncr") || r.Contains("calabarzon") || r.Contains("mimaropa") || r.Contains("barmm"))
            return "Luzon";
        if (region is "Luzon" or "Visayas" or "Mindanao") return region;
        return null;
    }
    private async Task<int> NextSupporterId()
    {
        var latest = await db.GetAllAsync<Supporter>("supporters", "select=supporter_id&order=supporter_id.desc&limit=1");
        return latest.Count == 0 ? 1 : (latest[0].SupporterId + 1);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Username/email and password are required" });

        var loginValue = req.Username.Trim();
        var user = await db.GetOneAsync<User>("users",
            $"or=(username.eq.{Esc(loginValue)},email.eq.{Esc(loginValue)})&select=*");
        if (user == null || string.IsNullOrEmpty(user.PasswordHash))
            return Unauthorized(new { message = "Invalid username or password" });

        if (!AuthService.VerifyPassword(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid username or password" });

        var token = auth.GenerateToken(user);
        return Ok(new LoginResponse(
            token,
            user.Username,
            user.DisplayName ?? user.Username,
            user.Role,
            user.Id,
            user.SupporterId));
    }

    [HttpPost("register")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        var (isValid, errors) = AuthService.ValidatePassword(req.Password);
        if (!isValid)
            return BadRequest(new { message = "Password does not meet requirements", errors });

        var existing = await db.GetOneAsync<User>("users", $"username=eq.{req.Username}");
        if (existing != null)
            return Conflict(new { message = "Username already exists" });

        var hash = AuthService.HashPassword(req.Password);
        var role = AuthService.NormalizeRole(req.Role);
        var user = await db.InsertAsync<User>("users", new
        {
            username = req.Username,
            password_hash = hash,
            display_name = req.DisplayName ?? req.Username,
            email = req.Email,
            role = string.IsNullOrWhiteSpace(role) ? "staff" : role
        });
        return Ok(user);
    }

    [HttpPost("register-donor")]
    [AllowAnonymous]
    public async Task<IActionResult> RegisterDonor([FromBody] RegisterDonorRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Password) ||
            string.IsNullOrWhiteSpace(req.SupporterType) ||
            string.IsNullOrWhiteSpace(req.Email))
        {
            return BadRequest(new { message = "Supporter type, email, and password are required" });
        }

        var (isValid, errors) = AuthService.ValidatePassword(req.Password);
        if (!isValid)
            return BadRequest(new { message = "Password does not meet requirements", errors });

        var username = string.IsNullOrWhiteSpace(req.Username) ? req.Email.Trim() : req.Username.Trim();
        var email = req.Email.Trim();

        var existingUser = await db.GetOneAsync<User>("users",
            $"or=(username.eq.{Esc(username)},email.eq.{Esc(email)})&select=id");
        if (existingUser != null)
            return Conflict(new { message = "An account with this username or email already exists" });

        var displayName = !string.IsNullOrWhiteSpace(req.DisplayName)
            ? req.DisplayName.Trim()
            : (!string.IsNullOrWhiteSpace(req.OrganizationName)
                ? req.OrganizationName.Trim()
                : $"{req.FirstName} {req.LastName}".Trim());

        var supporter = await db.InsertAsync<Supporter>("supporters", new
        {
            supporter_id = await NextSupporterId(),
            supporter_type = req.SupporterType,
            display_name = string.IsNullOrWhiteSpace(displayName) ? username : displayName,
            organization_name = req.OrganizationName,
            first_name = req.FirstName,
            last_name = req.LastName,
            relationship_type = req.RelationshipType ?? "Local",
            region = NormalizeRegion(req.Region),
            country = req.Country ?? "Philippines",
            email = email,
            phone = req.Phone,
            status = "Active",
            first_donation_date = req.FirstDonationDate,
            acquisition_channel = req.AcquisitionChannel ?? "Website",
            created_at = DateTime.UtcNow
        });

        if (supporter == null)
            return BadRequest(new { message = "Unable to create supporter profile. Account was not created." });

        var hash = AuthService.HashPassword(req.Password);
        var user = await db.InsertAsync<User>("users", new
        {
            username = username,
            password_hash = hash,
            display_name = string.IsNullOrWhiteSpace(displayName) ? username : displayName,
            email = email,
            role = "donor",
            is_active = true,
            created_at = DateTime.UtcNow,
            updated_at = DateTime.UtcNow,
            supporter_id = supporter.SupporterId
        });

        if (user == null)
            return BadRequest(new { message = "Unable to create account after supporter profile was created." });

        var token = auth.GenerateToken(user);
        return Ok(new LoginResponse(
            token,
            user.Username,
            user.DisplayName ?? user.Username,
            user.Role,
            user.Id,
            user.SupporterId));
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        var id = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var username = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var displayName = User.FindFirst("display_name")?.Value;
        var supporterId = User.FindFirst("supporter_id")?.Value;
        return Ok(new { id, username, role, displayName, supporterId });
    }
}
