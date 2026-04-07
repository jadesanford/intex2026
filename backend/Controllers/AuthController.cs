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

        // For donors, resolve supporterId via email if not set on the user record
        if (user.Role == "donor" && !user.SupporterId.HasValue && !string.IsNullOrEmpty(user.Email))
        {
            var supporter = await db.GetOneAsync<Supporter>("supporters", $"email=eq.{user.Email}&select=id");
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

        // Build display name: explicit > full name > username
        var fullName = $"{req.FirstName} {req.LastName}".Trim();
        var displayName = !string.IsNullOrEmpty(req.DisplayName) ? req.DisplayName
            : !string.IsNullOrEmpty(fullName) ? fullName
            : req.OrganizationName ?? req.Username;

        // Create supporter record first
        var supporter = await db.InsertAsync<Supporter>("supporters", new
        {
            name = displayName,
            supporter_type = req.SupporterType ?? "MonetaryDonor",
            display_name = displayName,
            organization_name = req.OrganizationName,
            first_name = req.FirstName,
            last_name = req.LastName,
            relationship_type = req.RelationshipType ?? "Local",
            region = req.Region,
            country = req.Country ?? "Philippines",
            email = req.Email,
            phone = req.Phone,
            status = "Active",
            acquisition_channel = req.AcquisitionChannel ?? "Website",
            first_donation_date = string.IsNullOrEmpty(req.FirstDonationDate) ? null : req.FirstDonationDate
        });

        // Create user account linked to the supporter
        var hash = AuthService.HashPassword(req.Password);
        var user = await db.InsertAsync<User>("users", new
        {
            username = req.Username,
            password_hash = hash,
            display_name = displayName,
            email = req.Email,
            role = "donor",
            supporter_id = supporter.SupporterId
        });

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
