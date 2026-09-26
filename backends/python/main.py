from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from jose import JWTError, jwt
import bcrypt
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, List

SECRET_KEY = "todo-app-secret-key-change-in-prod"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
DB_PATH = Path(__file__).parent / "todos.db"

security = HTTPBearer()

app = FastAPI(title="Todo API - Python")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)
    cur = conn.execute("SELECT COUNT(*) FROM users")
    if cur.fetchone()[0] == 0:
        h = hash_password("password123")
        conn.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", ("demo1", h))
        conn.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", ("demo2", h))
        conn.commit()
        print("Seeded demo users: demo1 / demo2")
    conn.close()

init_db()

class LoginRequest(BaseModel):
    username: str
    password: str

class TodoCreate(BaseModel):
    title: str

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None

class TodoOut(BaseModel):
    id: int
    title: str
    completed: bool
    userId: int

def create_token(user_id: int, username: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": str(user_id), "username": username, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: sqlite3.Connection = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        username = payload.get("username")
        row = db.execute("SELECT id, username FROM users WHERE id = ?", (user_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": row["id"], "username": row["username"]}
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/api/auth/login")
def login(body: LoginRequest, db: sqlite3.Connection = Depends(get_db)):
    row = db.execute("SELECT * FROM users WHERE username = ?", (body.username,)).fetchone()
    if not row or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_token(row["id"], row["username"])
    return {"token": token, "user": {"id": row["id"], "username": row["username"]}}

@app.get("/api/todos", response_model=List[TodoOut])
def list_todos(user=Depends(get_current_user), db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute(
        "SELECT id, title, completed, user_id as userId FROM todos WHERE user_id = ? ORDER BY id",
        (user["id"],)
    ).fetchall()
    return [{"id": r["id"], "title": r["title"], "completed": bool(r["completed"]), "userId": r["userId"]} for r in rows]

@app.post("/api/todos", response_model=TodoOut, status_code=201)
def create_todo(body: TodoCreate, user=Depends(get_current_user), db: sqlite3.Connection = Depends(get_db)):
    title = body.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Title cannot be empty")
    cur = db.execute("INSERT INTO todos (user_id, title, completed) VALUES (?, ?, 0)", (user["id"], title))
    db.commit()
    row = db.execute("SELECT id, title, completed, user_id as userId FROM todos WHERE id = ?", (cur.lastrowid,)).fetchone()
    return {"id": row["id"], "title": row["title"], "completed": False, "userId": row["userId"]}

@app.patch("/api/todos/{todo_id}", response_model=TodoOut)
def update_todo(todo_id: int, body: TodoUpdate, user=Depends(get_current_user), db: sqlite3.Connection = Depends(get_db)):
    row = db.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Todo not found")
    if row["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden: not your todo")
    title = body.title.strip() if body.title is not None else row["title"]
    completed = int(body.completed) if body.completed is not None else row["completed"]
    if not title:
        raise HTTPException(status_code=400, detail="Title cannot be empty")
    db.execute("UPDATE todos SET title = ?, completed = ? WHERE id = ?", (title, completed, todo_id))
    db.commit()
    updated = db.execute("SELECT id, title, completed, user_id as userId FROM todos WHERE id = ?", (todo_id,)).fetchone()
    return {"id": updated["id"], "title": updated["title"], "completed": bool(updated["completed"]), "userId": updated["userId"]}

@app.delete("/api/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: int, user=Depends(get_current_user), db: sqlite3.Connection = Depends(get_db)):
    row = db.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Todo not found")
    if row["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden: not your todo")
    db.execute("DELETE FROM todos WHERE id = ?", (todo_id,))
    db.commit()
    return None