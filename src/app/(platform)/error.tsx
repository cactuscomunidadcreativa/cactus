'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  return (
    <div className="flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-destructive" />
        </div>

        <h2 className="text-lg font-semibold mb-2">
          {t('errors.somethingWentWrong')}
        </h2>

        <p className="text-sm text-muted-foreground mb-6">
          {error.message || t('errors.generic')}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cactus-green hover:bg-cactus-green/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t('errors.tryAgain')}
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <Home className="w-4 h-4" />
            {t('errors.backToDashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
