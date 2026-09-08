using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EvidenceGraph.Core.DTOs;
using EvidenceGraph.Core.Entities;
using EvidenceGraph.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace EvidenceGraph.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly EvidenceGraphDbContext _db;
    private readonly IConfiguration _config;
    private readonly PasswordHasher<ApplicationUser> _hasher = new();

    public AuthController(EvidenceGraphDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (user == null || !user.IsActive)
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        var verifyResult = _hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verifyResult == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        user.LastLoginAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        var userDto = new UserDto(
            user.Id,
            user.Email,
            user.DisplayName,
            user.BadgeOrEmployeeNumber,
            user.Role,
            user.IsActive,
            user.CreatedAt,
            user.LastLoginAt
        );

        return Ok(new AuthResponse(token, userDto));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        return Ok(new UserDto(
            user.Id,
            user.Email,
            user.DisplayName,
            user.BadgeOrEmployeeNumber,
            user.Role,
            user.IsActive,
            user.CreatedAt,
            user.LastLoginAt
        ));
    }

    private string GenerateJwtToken(ApplicationUser user)
    {
        var key = _config["Jwt:Key"] ?? "EvidenceGraph_SuperSecure_JwtSecretKey_DevelopmentOnly_2026!_Min32Chars";
        var issuer = _config["Jwt:Issuer"] ?? "EvidenceGraph.Api";
        var audience = _config["Jwt:Audience"] ?? "EvidenceGraph.Web";
        var expiryMinutes = int.TryParse(_config["Jwt:ExpiryMinutes"], out var exp) ? exp : 120;

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.DisplayName),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("badge", user.BadgeOrEmployeeNumber)
        };

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
