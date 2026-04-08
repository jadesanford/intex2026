using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using OpenArms.Api.Models;

namespace OpenArms.Api.Services;

public class AuthService
{
    private readonly string _key;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expiryHours;

    public AuthService(string key, string issuer, string audience, int expiryHours)
    {
        _key = key;
        _issuer = issuer;
        _audience = audience;
        _expiryHours = expiryHours;
    }

    public string GenerateToken(User user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
        var normalizedRole = (user.Role ?? "").Trim().ToLowerInvariant();

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim(ClaimTypes.Role, normalizedRole),
            new Claim("display_name", user.DisplayName ?? user.Username),
            new Claim("supporter_id", user.SupporterId?.ToString() ?? "")
        };

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(_expiryHours),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static string HashPassword(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);

    public static bool VerifyPassword(string password, string hash)
    {
        // Normalize PHP-style $2y$ and $2x$ hashes to $2a$ which BCrypt.Net supports
        if (hash.StartsWith("$2y$") || hash.StartsWith("$2x$"))
            hash = "$2a$" + hash[4..];
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
        catch
        {
            return false;
        }
    }

    public static (bool IsValid, string[] Errors) ValidatePassword(string password)
    {
        var errors = new List<string>();
        if (password.Length < 14)
            errors.Add("Password must be at least 14 characters long.");
        if (!password.Any(char.IsUpper))
            errors.Add("Password must contain at least one uppercase letter.");
        if (!password.Any(char.IsLower))
            errors.Add("Password must contain at least one lowercase letter.");
        if (!password.Any(char.IsDigit))
            errors.Add("Password must contain at least one digit.");
        if (!password.Any(c => !char.IsLetterOrDigit(c)))
            errors.Add("Password must contain at least one non-alphanumeric character.");
        return (errors.Count == 0, errors.ToArray());
    }
}
