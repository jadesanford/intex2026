import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { login as loginApi } from '../lib/api'

interface User { id: number; username: string; displayName: string; role: string; supporterId?: number }
function normalizeRole(role: string | undefined) {
  return (role ?? '').trim().toLowerCase()
}

interface AuthCtx {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  loginWithData: (data: any) => void
  logout: () => void
  /** Internal user with full admin-panel access. */
  isAdmin: boolean
  /** Staff/admin internal user: uses /admin. */
  isInternalStaff: boolean
  isDonor: boolean
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

  const setUserFromData = (data: any) => {
    const u: User = {
      id: data.id, username: data.username,
      displayName: data.displayName, role: data.role,
      supporterId: data.supporterId ?? undefined
    }
    localStorage.setItem('oa_token', data.token)
    localStorage.setItem('oa_user', JSON.stringify(u))
    setUser(u)
  }

  const login = async (username: string, password: string) => {
    const data = await loginApi(username, password)
    setUserFromData(data)
    return data
  }

  const loginWithData = (data: any) => setUserFromData(data)

  const logout = () => {
    localStorage.removeItem('oa_token')
    localStorage.removeItem('oa_user')
    setUser(null)
    window.location.href = '/'
  }

  const r = normalizeRole(user?.role)
  const isInternalStaff = r === 'admin' || r === 'staff'
  return (
    <Ctx.Provider value={{
      user, loading, login, loginWithData, logout,
      isAdmin: r === 'admin',
      isInternalStaff,
      isDonor: r === 'donor'
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
