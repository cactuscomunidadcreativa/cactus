'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center shadow-lg">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        <h1 className="text-xl font-display font-bold mb-2">
          {t('errors.somethingWentWrong')}
        </h1>

        <p className="text-sm text-muted-foreground mb-6">
          {error.digest && (
            <span className="block text-xs font-mono mt-1 opacity-50">
              {error.digest}
            </span>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cactus-green hover:bg-cactus-green/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t('errors.tryAgain')}
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <Home className="w-4 h-4" />
            {t('errors.backToDashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
