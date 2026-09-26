import { useState } from 'react'

interface Todo {
  id: number
  title: string
  completed: boolean
}

interface Props {
  todos: Todo[]
  onToggle: (id: number, completed: boolean) => void
  onRename: (id: number, title: string) => void
  onDelete: (id: number) => void
}

export default function TodoList({ todos, onToggle, onRename, onDelete }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id)
    setEditTitle(todo.title)
  }

  const saveEdit = (id: number) => {
    onRename(id, editTitle)
    setEditingId(null)
  }

  if (todos.length === 0) {
    return <p className="empty">No todos yet. Add one above!</p>
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id, todo.completed)}
          />
          {editingId === todo.id ? (
            <input
              className="edit-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => saveEdit(todo.id)}
              onKeyDown={(e) => e.key === 'Enter' && saveEdit(todo.id)}
              autoFocus
            />
          ) : (
            <span className="todo-title" onDoubleClick={() => startEdit(todo)}>
              {todo.title}
            </span>
          )}
          <div className="todo-actions">
            <button onClick={() => startEdit(todo)} title="Rename">✏️</button>
            <button onClick={() => onDelete(todo.id)} title="Delete">🗑️</button>
          </div>
        </li>
      ))}
    </ul>
  )
}
