const CLARITY_PROJECT_ID = (import.meta.env.VITE_CLARITY_PROJECT_ID ?? '').trim()
const CLARITY_CONSENT_GRANTED = {
  ad_Storage: 'granted',
  analytics_Storage: 'granted',
} as const
const CLARITY_CONSENT_DENIED = {
  ad_Storage: 'denied',
  analytics_Storage: 'denied',
} as const

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

function ensureClaritySnippet() {
  if (!CLARITY_PROJECT_ID) return false
  if (typeof window === 'undefined' || typeof document === 'undefined') return false

  // Prevent double injection across route changes/hot reloads.
  if (typeof window.clarity === 'function') return true
  if (document.querySelector('script[data-clarity="1"]')) return true

  // Queue calls until Clarity finishes loading.
  ;(function (c: any, l: Document, a: string, r: string, i: string, t?: HTMLScriptElement, y?: Element) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) }
    t = l.createElement(r) as HTMLScriptElement
    t.async = true
    t.src = 'https://www.clarity.ms/tag/' + i
    t.setAttribute('data-clarity', '1')
    y = l.getElementsByTagName(r)[0]
    y?.parentNode?.insertBefore(t, y)
  })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID)

  return true
}

export function updateClarityConsent(consented: boolean) {
  if (!consented) {
    if (typeof window.clarity === 'function') {
      window.clarity('consentv2', CLARITY_CONSENT_DENIED)
      window.clarity('consent', false)
    }
    return
  }

  if (!ensureClaritySnippet()) return
  window.clarity?.('consentv2', CLARITY_CONSENT_GRANTED)
}

export function initClarityIfConsented() {
  if (!hasConsentAll()) return
  updateClarityConsent(true)
}

