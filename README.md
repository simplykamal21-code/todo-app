# Personal Todo App – Full-stack Exercise

Complete solution with **one React frontend** (left-side navigation dashboard) and **four interchangeable backends**:

| Backend              | Port  | Stack                          |
|----------------------|-------|--------------------------------|
| Node.js              | 3000  | Express + better-sqlite3 + JWT + bcrypt |
| Python               | 8000  | FastAPI + SQLite + python-jose + passlib |
| .NET Core            | 5000  | ASP.NET Core 8 + EF Core SQLite + JWT + BCrypt |
| Java / Spring Boot   | 8080  | Spring Boot 3 + JPA + SQLite + JJWT + Spring Security |

All backends implement the same API contract, enforce authentication + ownership on every todo operation, use hashed passwords, and persist data in SQLite.

## Demo accounts (all backends)

- `demo1` / `password123`
- `demo2` / `password123`

## Quick start

### 1. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173  
On the login screen choose which backend to talk to.

### 2. Backends (run any or all)

**Node.js**
```bash
cd backends/nodejs
npm install
npm start
# Tests: npm test
```

**Python**
```bash
cd backends/python
python -m venv venv && source venv/bin/activate   # or Windows equivalent
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Tests: pytest
```

**.NET Core** (requires .NET 8 SDK)
```bash
cd backends/dotnet
dotnet restore
dotnet run
```

**Java / Spring Boot** (requires JDK 17+ and Maven)
```bash
cd backends/java
mvn spring-boot:run
# Tests: mvn test
```

## API contract (identical across backends)

```
POST   /api/auth/login          { "username", "password" } → { "token", "user" }
GET    /api/todos               Bearer token → list of own todos
POST   /api/todos               { "title" } → created todo
PATCH  /api/todos/:id           { "title"?, "completed"? } → updated todo
DELETE /api/todos/:id           → 204
```

- Empty title → 400  
- Missing/invalid token → 401  
- Accessing another user’s todo → 403  

## Design choices

- **JWT** (Bearer) for stateless auth; secret is hard-coded for local demo only.
- **bcrypt / BCrypt** for password hashing – never store plaintext.
- **Ownership enforced in every backend handler** (not only in the UI). A user who obtains another user’s todo ID still receives 403.
- **SQLite** file per backend (`todos.db`) – data survives restarts.
- **CORS** wide-open for local development.
- React UI uses left-hand navigation, simple toast messages, double-click-to-edit, and a backend selector on the login page so you can switch stacks without rebuilding.

## Automated tests (required by the exercise)

Each backend contains at least two tests:

1. Successful todo create + list for the authenticated user.
2. Another user cannot read / update / delete the first user’s todo (returns 403).

## Unfinished / out-of-scope (as permitted)

- No registration, password reset, e-mail verification.
- No Docker, CI/CD, Redis, sharing, admin panel, or elaborate styling.
- Frontend is deliberately simple; visual polish was not a goal.
- .NET and Java require their respective SDKs to be installed on the machine.

## Agent used

This solution was produced with **Grok** (xAI).  
The full conversation history is the chat that generated this repository.  
See **AGENTS.md** in the project root for full details on the AI coding agent used (Grok), the conversation context, and a concrete example of code that was reviewed and corrected.

## Example of code reviewed / corrected

While implementing the Node.js ownership check, an early version only filtered the list endpoint.  
A direct `PATCH /api/todos/1` from another user would have succeeded.  
This was corrected by adding an explicit ownership guard in every mutating handler (and the same pattern was applied consistently to the other three backends).

---

Created for the Full-stack exercise specification.
