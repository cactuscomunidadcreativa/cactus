'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  return (
    <div className="flex items-center justify-center py-16 px-4">
      <div className="max-w-sm w-full bg-card border border-border rounded-xl p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>

        <h2 className="text-base font-semibold mb-1.5">
          {t('errors.appError')}
        </h2>

        <p className="text-xs text-muted-foreground mb-5">
          {error.message}
        </p>

        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cactus-green hover:bg-cactus-green/90 text-white rounded-md text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('errors.tryAgain')}
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-sm hover:bg-muted transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            {t('errors.backToDashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
