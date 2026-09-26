# AI Coding Agent Usage

## Agent Used
**Grok** (built by xAI)

This entire application (React frontend + four backends: Node.js, Python/FastAPI, .NET Core, Java/Spring Boot) was developed with the assistance of Grok.

## Full Conversation
The complete conversation history that produced this codebase is the chat thread in which this repository was generated.  
(The conversation includes iterative design, code generation, testing fixes, ownership enforcement, UI layout with left navigation, multi-backend support, etc.)

## One Example of Code Reviewed / Corrected

### Problem (early version – Node.js backend)

Initially the list endpoint filtered by `user_id`, but the update and delete endpoints only checked that a todo *existed*. A malicious (or curious) user who knew another user’s todo ID could still modify or delete it by calling the API directly.

**Vulnerable code (before correction):**

```js
// PATCH /api/todos/:id  (early version)
app.patch('/api/todos/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id)
  if (!todo) return res.status(404).json({ message: 'Todo not found' })

  // ❌ Missing ownership check!
  const title = req.body.title !== undefined ? String(req.body.title).trim() : todo.title
  const completed = req.body.completed !== undefined ? (req.body.completed ? 1 : 0) : todo.completed
  // ... update proceeds
})
```

### Correction Applied

An explicit ownership guard was added to **every** mutating endpoint (PATCH and DELETE) in all four backends.

**Corrected code:**

```js
// PATCH /api/todos/:id  (final version)
app.patch('/api/todos/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id)
  if (!todo) return res.status(404).json({ message: 'Todo not found' })
  if (todo.user_id !== req.userId) {
    return res.status(403).json({ message: 'Forbidden: not your todo' })  // ✅ Ownership enforced
  }
  // ... rest of update
})
```

The same ownership check was then consistently applied to:
- Node.js (Express)
- Python (FastAPI)
- .NET Core (TodosController)
- Java / Spring Boot (TodoController)

This is a concrete example of the agent reviewing generated code, identifying a security gap, and correcting it across all implementations.

## Design Decisions Documented by the Agent
- JWT + bcrypt for authentication (no plaintext passwords)
- Backend-enforced ownership (not just UI hiding)
- Identical API contract across four languages
- Left-side navigation dashboard in React
- SQLite for simple persistent local storage
- Two automated tests per backend covering success path + cross-user isolation

