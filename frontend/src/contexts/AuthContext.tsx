import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { getMe, login as loginApi, logoutRequest } from '../lib/api'

interface User { id: number; username: string; displayName: string; role: string; supporterId?: number }
function normalizeRole(role: string | undefined) {
  const normalized = (role ?? '').trim().toLowerCase()
  return normalized === 'admin' ? 'staff' : normalized
}

interface AuthCtx {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  loginWithData: (data: any) => void
  logout: () => Promise<void>
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
    let cancelled = false
    ;(async () => {
      try {
        const me = await getMe()
        if (cancelled) return
        const u: User = {
          id: Number(me.id),
          username: me.username,
          displayName: me.displayName ?? me.username,
          role: me.role,
          supporterId: me.supporterId != null && me.supporterId !== ''
            ? Number(me.supporterId)
            : undefined,
        }
        setUser(u)
        localStorage.setItem('oa_user', JSON.stringify(u))
      } catch {
        if (!cancelled) {
          localStorage.removeItem('oa_user')
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const setUserFromData = (data: any) => {
    const u: User = {
      id: data.id, username: data.username,
      displayName: data.displayName, role: data.role,
      supporterId: data.supporterId ?? undefined
    }
    localStorage.setItem('oa_user', JSON.stringify(u))
    flushSync(() => setUser(u))
  }

  const login = async (username: string, password: string) => {
    const data = await loginApi(username, password)
    setUserFromData(data)
    return data
  }

  const loginWithData = (data: any) => setUserFromData(data)

  const logout = async () => {
    try { await logoutRequest() } catch { /* ignore network errors */ }
    localStorage.removeItem('oa_user')
    setUser(null)
    window.location.href = '/'
  }

  const r = normalizeRole(user?.role)
  const isInternalStaff = r === 'admin' || r === 'staff'
  return (
    <Ctx.Provider value={{
      user, loading, login, loginWithData, logout,
      isAdmin: isInternalStaff,
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
