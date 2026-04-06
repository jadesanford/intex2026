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

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("display_name", user.DisplayName ?? user.Username)
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

    public static bool VerifyPassword(string password, string hash) =>
        BCrypt.Net.BCrypt.Verify(password, hash);
}
