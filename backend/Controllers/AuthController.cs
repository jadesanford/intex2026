using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenArms.Api.Models;
using OpenArms.Api.Services;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(SupabaseService db, AuthService auth) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await db.GetOneAsync<User>("users", $"username=eq.{req.Username}&select=*");
        if (user == null || string.IsNullOrEmpty(user.PasswordHash))
            return Unauthorized(new { message = "Invalid username or password" });

        if (!AuthService.VerifyPassword(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid username or password" });

        // For donors, resolve supporterId via email if not already set
        if (user.Role == "donor" && !user.SupporterId.HasValue && !string.IsNullOrEmpty(user.Email))
        {
            var supporter = await db.GetOneAsync<Supporter>("supporters", $"email=eq.{user.Email}&select=supporter_id");
            if (supporter != null) user.SupporterId = supporter.SupporterId;
        }

        var token = auth.GenerateToken(user);
        return Ok(new LoginResponse(token, user.Username, user.DisplayName ?? user.Username, user.Role, user.Id, user.SupporterId));
    }

    [HttpPost("register")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        var existing = await db.GetOneAsync<User>("users", $"username=eq.{req.Username}");
        if (existing != null)
            return Conflict(new { message = "Username already exists" });

        var hash = AuthService.HashPassword(req.Password);
        var user = await db.InsertAsync<User>("users", new
        {
            username = req.Username,
            password_hash = hash,
            display_name = req.DisplayName ?? req.Username,
            email = req.Email,
            role = req.Role
        });
        return Ok(user);
    }

    [HttpPost("register-donor")]
    [AllowAnonymous]
    public async Task<IActionResult> RegisterDonor([FromBody] RegisterDonorRequest req)
    {
        var existing = await db.GetOneAsync<User>("users", $"username=eq.{req.Username}");
        if (existing != null)
            return Conflict(new { message = "An account with that email already exists" });

        var displayName = $"{req.FirstName} {req.LastName}".Trim();
        if (string.IsNullOrEmpty(displayName)) displayName = req.Username;

        // Create supporter record first
        var supporter = await db.InsertAsync<Supporter>("supporters", new
        {
            supporter_type = "Individual",
            first_name = req.FirstName,
            last_name = req.LastName,
            display_name = displayName,
            email = req.Email,
            phone = req.Phone,
            city = req.City,
            country = req.Country ?? "Philippines",
            relationship_type = "Donor",
            status = "Active",
            acquisition_channel = "Website"
        });

        // Create user account (role = donor)
        var hash = AuthService.HashPassword(req.Password);
        var user = await db.InsertAsync<User>("users", new
        {
            username = req.Username,
            password_hash = hash,
            display_name = displayName,
            email = req.Email,
            role = "donor"
        });

        // Link supporter_id for the JWT (resolved via email at login)
        user.SupporterId = supporter.SupporterId;

        var token = auth.GenerateToken(user);
        return Ok(new LoginResponse(token, user.Username, user.DisplayName ?? user.Username, user.Role, user.Id, user.SupporterId));
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
