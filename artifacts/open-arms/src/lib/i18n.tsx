import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'id';

interface Translations {
  [key: string]: {
    en: string;
    id: string;
  };
}

const translations: Translations = {
  'nav.home': { en: 'Home', id: 'Beranda' },
  'nav.impact': { en: 'Our Impact', id: 'Dampak Kami' },
  'nav.login': { en: 'Staff Login', id: 'Masuk Staf' },
  'hero.tagline': { en: 'A safe place to heal', id: 'Tempat yang aman untuk pulih' },
  'hero.title': { en: 'Open Arms', id: 'Pelukan Terbuka' },
  'hero.desc': { en: 'Supporting girls who are survivors of sexual abuse and trafficking in Indonesia.', id: 'Mendukung anak perempuan penyintas kekerasan seksual dan perdagangan manusia di Indonesia.' },
  'btn.getHelp': { en: 'Get Help', id: 'Dapatkan Bantuan' },
  'btn.donate': { en: 'Donate', id: 'Donasi' },
  'footer.privacy': { en: 'Privacy Policy', id: 'Kebijakan Privasi' },
  'cookie.msg': { en: 'We use cookies to ensure you get the best experience on our website.', id: 'Kami menggunakan cookie untuk memastikan Anda mendapatkan pengalaman terbaik di situs web kami.' },
  'cookie.accept': { en: 'Accept', id: 'Terima' },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
