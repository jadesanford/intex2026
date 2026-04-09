const CLARITY_PROJECT_ID = (import.meta.env.VITE_CLARITY_PROJECT_ID ?? '').trim()

function hasConsentAll() {
  try {
    return localStorage.getItem('oa_cookie_consent') === 'all'
  } catch {
    return false
  }
}

declare global {
  interface Window {
    clarity?: (...args: any[]) => void
  }
}

export function initClarityIfConsented() {
  if (!CLARITY_PROJECT_ID) return
  if (!hasConsentAll()) return

  // Prevent double injection across route changes/hot reloads.
  if (typeof window.clarity === 'function') return
  if (document.querySelector('script[data-clarity="1"]')) return

  ;(function (c: any, l: Document, a: string, r: string, i: string, t?: HTMLScriptElement, y?: Element) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) }
    t = l.createElement(r) as HTMLScriptElement
    t.async = true
    t.src = 'https://www.clarity.ms/tag/' + i
    t.setAttribute('data-clarity', '1')
    y = l.getElementsByTagName(r)[0]
    y?.parentNode?.insertBefore(t, y)
  })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID)
}

