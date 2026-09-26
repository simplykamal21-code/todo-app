package com.todo.controller;

import com.todo.model.Todo;
import com.todo.repository.TodoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/todos")
public class TodoController {
    private final TodoRepository todos;
    public TodoController(TodoRepository todos) { this.todos = todos; }

    private Long currentUserId(Authentication auth) {
        return (Long) auth.getPrincipal();
    }

    @GetMapping
    public List<Map<String, Object>> list(Authentication auth) {
        return todos.findByUserIdOrderByIdAsc(currentUserId(auth)).stream()
            .map(t -> Map.<String, Object>of(
                "id", t.getId(), "title", t.getTitle(),
                "completed", t.isCompleted(), "userId", t.getUserId()))
            .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> body, Authentication auth) {
        String title = body.getOrDefault("title", "").trim();
        if (title.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Title cannot be empty"));
        Todo t = new Todo();
        t.setUserId(currentUserId(auth));
        t.setTitle(title);
        t.setCompleted(false);
        todos.save(t);
        return ResponseEntity.status(201).body(Map.of(
            "id", t.getId(), "title", t.getTitle(), "completed", false, "userId", t.getUserId()));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        Todo t = todos.findById(id).orElse(null);
        if (t == null) return ResponseEntity.notFound().build();
        if (!t.getUserId().equals(currentUserId(auth)))
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden: not your todo"));
        if (body.containsKey("title")) {
            String title = String.valueOf(body.get("title")).trim();
            if (title.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Title cannot be empty"));
            t.setTitle(title);
        }
        if (body.containsKey("completed")) t.setCompleted(Boolean.TRUE.equals(body.get("completed")));
        todos.save(t);
        return ResponseEntity.ok(Map.of("id", t.getId(), "title", t.getTitle(), "completed", t.isCompleted(), "userId", t.getUserId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        Todo t = todos.findById(id).orElse(null);
        if (t == null) return ResponseEntity.notFound().build();
        if (!t.getUserId().equals(currentUserId(auth)))
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden: not your todo"));
        todos.delete(t);
        return ResponseEntity.noContent().build();
    }
}
