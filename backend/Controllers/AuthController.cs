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
        try
        {
            if (req == null)
                return BadRequest(new { message = "Request body is required" });

            var username = (req.Username ?? "").Trim();
            var email = (req.Email ?? "").Trim();
            var password = req.Password ?? "";

            if (string.IsNullOrWhiteSpace(username))
                return BadRequest(new { message = "Email/username is required" });
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "Email is required" });
            if (string.IsNullOrWhiteSpace(password))
                return BadRequest(new { message = "Password is required" });

            var existing = await db.GetOneAsync<User>("users", $"username=eq.{username}");
            if (existing != null)
                return Conflict(new { message = "An account with that email already exists" });

            var existingUserEmail = await db.GetOneAsync<User>("users", $"email=eq.{email}");
            if (existingUserEmail != null)
                return Conflict(new { message = "An account with that email already exists" });

            var existingSupporterEmail = await db.GetOneAsync<Supporter>("supporters", $"email=eq.{email}");
            if (existingSupporterEmail != null)
                return Conflict(new { message = "A supporter profile with that email already exists" });

            // Build display name: explicit > full name > username
            var fullName = $"{req.FirstName} {req.LastName}".Trim();
            var displayName = !string.IsNullOrEmpty(req.DisplayName) ? req.DisplayName
                : !string.IsNullOrEmpty(fullName) ? fullName
                : req.OrganizationName ?? username;

            // Create supporter record first (current schema)
            var supporter = await db.InsertAsync<Supporter>("supporters", new
            {
                supporter_type = req.SupporterType ?? "MonetaryDonor",
                display_name = displayName,
                organization_name = req.OrganizationName,
                first_name = req.FirstName,
                last_name = req.LastName,
                relationship_type = req.RelationshipType ?? "Local",
                region = req.Region,
                country = req.Country ?? "Philippines",
                email = email,
                phone = req.Phone,
                status = "Active",
                acquisition_channel = req.AcquisitionChannel ?? "Website"
            });
            // Fallback for legacy schema variants that use name/type/city columns.
            if (supporter == null)
            {
                supporter = await db.InsertAsync<Supporter>("supporters", new
                {
                    name = displayName,
                    type = req.SupporterType ?? "MonetaryDonor",
                    email = email,
                    phone = req.Phone,
                    country = req.Country ?? "Philippines",
                    city = req.Region,
                    status = "active",
                    notes = $"relationship_type={req.RelationshipType ?? "Local"}; acquisition_channel={req.AcquisitionChannel ?? "Website"}"
                });
            }
            if (supporter == null)
                return BadRequest(new { message = "Unable to create supporter profile. Please verify your details and try again." });

            // Some schemas return different id fields; recover supporter id by email when needed.
            var supporterId = supporter.SupporterId;
            if (supporterId <= 0)
            {
                var supporterByEmail = await db.GetOneAsync<Supporter>("supporters", $"email=eq.{email}&select=id,supporter_id");
                supporterId = supporterByEmail?.SupporterId ?? 0;
            }
            if (supporterId <= 0)
                return BadRequest(new { message = "Supporter profile created, but linking to user failed. Please contact support." });

            // Create user account linked to the supporter
            var hash = AuthService.HashPassword(password);
            var user = await db.InsertAsync<User>("users", new
            {
                username = username,
                password_hash = hash,
                display_name = displayName,
                email = email,
                role = "donor",
                supporter_id = supporterId
            });
            if (user == null)
                return BadRequest(new { message = "Unable to create user account. Please verify your details and try again." });

            user.SupporterId = supporterId;

            var token = auth.GenerateToken(user);
            return Ok(new LoginResponse(token, user.Username, user.DisplayName ?? user.Username, user.Role, user.Id, user.SupporterId));
        }
        catch
        {
            // Prevent raw 500s from leaking; return actionable error to the client.
            return BadRequest(new { message = "Registration failed due to a data mismatch. Please verify required fields and try again." });
        }
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
