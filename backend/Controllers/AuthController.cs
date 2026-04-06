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

        var token = auth.GenerateToken(user);
        return Ok(new LoginResponse(token, user.Username, user.DisplayName ?? user.Username, user.Role, user.Id));
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

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        var id = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var username = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var displayName = User.FindFirst("display_name")?.Value;
        return Ok(new { id, username, role, displayName });
    }
}
