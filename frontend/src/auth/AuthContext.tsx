import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'

interface User {
  id: number
  username: string
}

interface AuthContextType {
  token: string | null
  user: User | null
  login: (token: string) => void
  logout: () => void
  apiBase: string
  setApiBase: (url: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(null)
  const [apiBase, setApiBaseState] = useState<string>(
    localStorage.getItem('apiBase') || 'http://localhost:3000'
  )

  useEffect(() => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token)
        setUser({ id: decoded.sub || decoded.userId || decoded.id, username: decoded.username || decoded.unique_name || 'user' })
      } catch {
        setToken(null)
        localStorage.removeItem('token')
      }
    } else {
      setUser(null)
    }
  }, [token])

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const setApiBase = (url: string) => {
    localStorage.setItem('apiBase', url)
    setApiBaseState(url)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, apiBase, setApiBase }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
