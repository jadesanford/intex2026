import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getMe } from '../lib/api'

const PENDING_KEY = 'oa_google_oauth_pending_token'

/**
 * After Google login the API redirects to {FrontendBaseUrl}/#token=...
 * Finishes sign-in via /auth/me. Uses sessionStorage PENDING so React Strict Mode can finish after hash is cleared.
 *
 * Note: Do not dedupe with token.slice(0, n) — JWT headers are identical, so that blocked every login after the first.
 */
export default function GoogleOAuthHandler() {
  const navigate = useNavigate()
  const { loginWithData } = useAuth()
  const loginWithDataRef = useRef(loginWithData)
  loginWithDataRef.current = loginWithData

  useEffect(() => {
    let cancelled = false

    async function run() {
      let token: string | null = null
      const raw = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash

      if (raw.includes('token=')) {
        const params = new URLSearchParams(raw)
        token = params.get('token')
        if (!token) {
          navigate('/login?error=google_missing_token', { replace: true })
          return
        }
        sessionStorage.setItem(PENDING_KEY, token)
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      } else {
        token = sessionStorage.getItem(PENDING_KEY)
        if (!token) return
      }

      localStorage.setItem('oa_token', token)
      try {
        const me = await getMe()
        if (cancelled) return

        const rawRole = (me.role ?? (me as { Role?: string }).Role ?? '').toString().trim().toLowerCase()
        if (!rawRole) {
          sessionStorage.removeItem(PENDING_KEY)
          localStorage.removeItem('oa_token')
          localStorage.removeItem('oa_user')
          navigate('/login?error=google_role', { replace: true })
          return
        }

        const normalizedRole = rawRole === 'admin' ? 'staff' : rawRole
        const id = Number(me.id ?? (me as { Id?: string | number }).Id)
        if (!Number.isFinite(id)) {
          sessionStorage.removeItem(PENDING_KEY)
          navigate('/login?error=google_session_failed', { replace: true })
          return
        }

        const sidRaw = me.supporterId ?? (me as { SupporterId?: string | number }).SupporterId
        const supporterId =
          sidRaw != null && sidRaw !== '' && !Number.isNaN(Number(sidRaw)) ? Number(sidRaw) : undefined

        loginWithDataRef.current({
          token,
          id,
          username: me.username ?? (me as { Username?: string }).Username ?? '',
          displayName: me.displayName ?? (me as { DisplayName?: string }).DisplayName ?? me.username ?? '',
          role: normalizedRole,
          supporterId,
        })
        sessionStorage.removeItem(PENDING_KEY)

        if (normalizedRole === 'donor') {
          navigate('/donor', { replace: true })
        } else if (normalizedRole === 'staff') {
          navigate('/admin', { replace: true })
        } else {
          navigate('/login?error=google_role', { replace: true })
        }
      } catch {
        sessionStorage.removeItem(PENDING_KEY)
        localStorage.removeItem('oa_token')
        localStorage.removeItem('oa_user')
        if (!cancelled) navigate('/login?error=google_session_failed', { replace: true })
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [navigate])

  return null
}
