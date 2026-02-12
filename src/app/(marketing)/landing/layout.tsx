import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('landing.shared');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">{t('backToHome')}</span>
            </Link>
          </div>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌵</span>
            <span className="font-display font-bold text-lg text-cactus-green">Cactus</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-cactus-green text-white rounded-md text-sm font-medium hover:bg-cactus-green/90 transition-colors"
            >
              {t('getStarted')}
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      {children}

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>🌵</span>
          <span>Cactus Comunidad Creativa</span>
          <span>·</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
