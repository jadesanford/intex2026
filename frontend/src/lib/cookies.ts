export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const encoded = encodeURIComponent(name) + '='
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const p = part.trim()
    if (p.startsWith(encoded)) return decodeURIComponent(p.slice(encoded.length))
  }
  return null
}

type CookieOptions = {
  /** Days until expiry. Defaults to 365. */
  days?: number
  path?: string
  sameSite?: 'Lax' | 'Strict' | 'None'
  secure?: boolean
}

export function setCookie(name: string, value: string, opts: CookieOptions = {}) {
  if (typeof document === 'undefined') return
  const days = opts.days ?? 365
  const path = opts.path ?? '/'
  const sameSite = opts.sameSite ?? 'Lax'
  const secure = opts.secure ?? (typeof window !== 'undefined' && window.location.protocol === 'https:')

  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Expires=${expires}; Path=${path}; SameSite=${sameSite}`
  if (secure) cookie += '; Secure'
  document.cookie = cookie
}

