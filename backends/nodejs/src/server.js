import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const db = new Database(join(__dirname, '..', 'todos.db'))
const JWT_SECRET = 'todo-app-secret-key-change-in-prod'
const PORT = 3000

// Init schema & seed
db.exec(`
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
`)

const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c
if (userCount === 0) {
  const hash = bcrypt.hashSync('password123', 10)
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('demo1', hash)
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('demo2', hash)
  console.log('Seeded demo users: demo1 / demo2 (password: password123)')
}

const app = express()
app.use(cors())
app.use(express.json())

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET)
    req.userId = payload.sub
    req.username = payload.username
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

// Auth
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' })
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Invalid username or password' })
  }
  const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' })
  res.json({ token, user: { id: user.id, username: user.username } })
})

// Todos (all protected + ownership enforced)
app.get('/api/todos', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT id, title, completed, user_id as userId FROM todos WHERE user_id = ? ORDER BY id').all(req.userId)
  res.json(rows.map(r => ({ ...r, completed: !!r.completed })))
})

app.post('/api/todos', authMiddleware, (req, res) => {
  const title = (req.body?.title || '').trim()
  if (!title) return res.status(400).json({ message: 'Title cannot be empty' })
  const result = db.prepare('INSERT INTO todos (user_id, title, completed) VALUES (?, ?, 0)').run(req.userId, title)
  const todo = db.prepare('SELECT id, title, completed, user_id as userId FROM todos WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ ...todo, completed: !!todo.completed })
})

app.patch('/api/todos/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id)
  if (!todo) return res.status(404).json({ message: 'Todo not found' })
  if (todo.user_id !== req.userId) return res.status(403).json({ message: 'Forbidden: not your todo' })

  const title = req.body.title !== undefined ? String(req.body.title).trim() : todo.title
  const completed = req.body.completed !== undefined ? (req.body.completed ? 1 : 0) : todo.completed
  if (!title) return res.status(400).json({ message: 'Title cannot be empty' })

  db.prepare('UPDATE todos SET title = ?, completed = ? WHERE id = ?').run(title, completed, id)
  const updated = db.prepare('SELECT id, title, completed, user_id as userId FROM todos WHERE id = ?').get(id)
  res.json({ ...updated, completed: !!updated.completed })
})

app.delete('/api/todos/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id)
  if (!todo) return res.status(404).json({ message: 'Todo not found' })
  if (todo.user_id !== req.userId) return res.status(403).json({ message: 'Forbidden: not your todo' })
  db.prepare('DELETE FROM todos WHERE id = ?').run(id)
  res.status(204).send()
})

app.listen(PORT, () => console.log(`Node.js Todo API running on http://localhost:${PORT}`))
export default app
