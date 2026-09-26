using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TodoApi.Data;
using BCrypt.Net;

namespace TodoApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    public AuthController(AppDbContext db) => _db = db;

    public record LoginRequest(string Username, string Password);

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == req.Username);
        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid username or password" });

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("todo-app-secret-key-change-in-prod-must-be-long-enough"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[] {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim("username", user.Username)
        };
        var token = new JwtSecurityToken(claims: claims, expires: DateTime.UtcNow.AddHours(24), signingCredentials: creds);
        return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token), user = new { id = user.Id, username = user.Username } });
    }
}
