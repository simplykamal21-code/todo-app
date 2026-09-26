import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { createApiClient } from '../api/client'
import TodoList from '../components/TodoList'
import '../App.css'

interface Todo {
  id: number
  title: string
  completed: boolean
  userId?: bur
}

export default function Dashboard() {
  const { token, user, logout, apiBase } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [msg, setMsg] = useState('')

  const api = createApiClient(apiBase, token)

  const fetchTodos = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/todos')
      setTodos(res.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load todos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [apiBase, token])

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      setMsg('Title cannot be empty')
      return
    }
    try {
      const res = await api.post('/api/todos', { title: newTitle.trim() })
      setTodos([...todos, res.data])
      setNewTitle('')
      setMsg('Todo added')
      setTimeout(() => setMsg(''), 2000)
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to add todo')
    }
  }

  const toggleTodo = async (id: number, completed: boolean) => {
    try {
      const res = await api.patch(`/api/todos/${id}`, { completed: !completed })
      setTodos(todos.map(t => t.id === id ? res.data : t))
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to update')
    }
  }

  const renameTodo = async (id: number, title: string) => {
    if (!title.trim()) {
      setMsg('Title cannot be empty')
      return
    }
    try {
      const res = await api.patch(`/api/todos/${id}`, { title: title.trim() })
      setTodos(todos.map(t => t.id === id ? res.data : t))
      setMsg('Updated')
      setTimeout(() => setMsg(''), 1500)
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to rename')
    }
  }

  const deleteTodo = async (id: number) => {
    try {
      await api.delete(`/api/todos/${id}`)
      setTodos(todos.filter(t => t.id !== id))
      setMsg('Deleted')
      setTimeout(() => setMsg(''), 1500)
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to delete')
    }
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Todo App</h2>
          <p className="user-info">Hello, <strong>{user?.username}</strong></p>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">📋 My Todos</a>
        </nav>
        <div className="sidebar-footer">
          <p className="api-info">API: {apiBase.replace('http://', '')}</p>
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h1>My Todos</h1>
          {msg && <span className="toast">{msg}</span>}
        </header>

        <form onSubmit={addTodo} className="add-form">
          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button type="submit" className="btn-primary">Add</button>
        </form>

        {error && <div className="error-msg">{error}</div>}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <TodoList
            todos={todos}
            onToggle={toggleTodo}
            onRename={renameTodo}
            onDelete={deleteTodo}
          />
        )}
      </main>
    </div>
  )
}
