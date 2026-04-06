import { ReactNode } from "react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function PublicLayout({ children }: { children: ReactNode }) {
  const { t, language, setLanguage } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-serif text-xl font-semibold text-primary">
            Open Arms
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              {t('nav.home')}
            </Link>
            <Link href="/impact" className="text-sm font-medium hover:text-primary transition-colors">
              {t('nav.impact')}
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
            >
              {language === 'en' ? 'ID' : 'EN'}
            </button>
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">
              {t('nav.login')}
            </Link>
            <Button asChild className="rounded-full px-6">
              <Link href="/#donate">{t('btn.donate')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-secondary/30 text-secondary-foreground py-12">
        <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="font-serif text-xl font-semibold text-primary mb-4">Open Arms</h3>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-6">
              {t('hero.desc')}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Organization</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/impact" className="hover:text-primary transition-colors">Impact</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">{t('footer.privacy')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Portal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/login" className="hover:text-primary transition-colors">Staff Login</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 md:px-6 mt-12 pt-8 border-t border-border/50 text-xs text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} Open Arms. All rights reserved.
        </div>
      </footer>
    </div>
  );
}