import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { login as loginApi } from '../lib/api'

interface User { id: number; username: string; displayName: string; role: string }
interface AuthCtx {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('oa_user')
    const token = localStorage.getItem('oa_token')
    if (stored && token) {
      try { setUser(JSON.parse(stored)) } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const data = await loginApi(username, password)
    const u: User = { id: data.id, username: data.username, displayName: data.displayName, role: data.role }
    localStorage.setItem('oa_token', data.token)
    localStorage.setItem('oa_user', JSON.stringify(u))
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('oa_token')
    localStorage.removeItem('oa_user')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <Ctx.Provider value={{ user, loading, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
