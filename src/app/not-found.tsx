import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('common');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl font-display font-bold text-cactus-green/20 mb-4">
          404
        </div>

        <h1 className="text-xl font-display font-bold mb-2">
          {t('errors.pageNotFound')}
        </h1>

        <p className="text-sm text-muted-foreground mb-8">
          {t('errors.pageNotFoundDescription')}
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-cactus-green hover:bg-cactus-green/90 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {t('errors.backToDashboard')}
        </Link>
      </div>
    </div>
  );
}
