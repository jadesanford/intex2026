import { createContext, useContext, useState, type ReactNode } from 'react'

export type SiteLang = 'en' | 'tl'

type LangCtx = { lang: SiteLang; setLang: (l: SiteLang) => void }

const Ctx = createContext<LangCtx | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<SiteLang>('en')
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>
}

export function useLanguage() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useLanguage must be used within LanguageProvider')
  return c
}
