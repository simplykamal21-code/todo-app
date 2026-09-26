using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoApi.Data;
using TodoApi.Models;

namespace TodoApi.Controllers;

[ApiController]
[Route("api/todos")]
[Authorize]
public class TodosController : ControllerBase
{
    private readonly AppDbContext _db;
    public TodosController(AppDbContext db) => _db = db;

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var todos = await _db.Todos.Where(t => t.UserId == CurrentUserId)
            .Select(t => new { t.Id, t.Title, t.Completed, userId = t.UserId })
            .ToListAsync();
        return Ok(todos);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTodoDto dto)
    {
        var title = (dto.Title ?? "").Trim();
        if (string.IsNullOrEmpty(title)) return BadRequest(new { message = "Title cannot be empty" });
        var todo = new Todo { UserId = CurrentUserId, Title = title, Completed = false };
        _db.Todos.Add(todo);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(List), new { id = todo.Id, title = todo.Title, completed = todo.Completed, userId = todo.UserId });
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTodoDto dto)
    {
        var todo = await _db.Todos.FindAsync(id);
        if (todo == null) return NotFound(new { message = "Todo not found" });
        if (todo.UserId != CurrentUserId) return StatusCode(403, new { message = "Forbidden: not your todo" });
        if (dto.Title != null)
        {
            var t = dto.Title.Trim();
            if (string.IsNullOrEmpty(t)) return BadRequest(new { message = "Title cannot be empty" });
            todo.Title = t;
        }
        if (dto.Completed.HasValue) todo.Completed = dto.Completed.Value;
        await _db.SaveChangesAsync();
        return Ok(new { todo.Id, todo.Title, todo.Completed, userId = todo.UserId });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var todo = await _db.Todos.FindAsync(id);
        if (todo == null) return NotFound(new { message = "Todo not found" });
        if (todo.UserId != CurrentUserId) return StatusCode(403, new { message = "Forbidden: not your todo" });
        _db.Todos.Remove(todo);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    public record CreateTodoDto(string Title);
    public record UpdateTodoDto(string? Title, bool? Completed);
}
