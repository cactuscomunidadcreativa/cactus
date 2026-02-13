import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { APP_INFO } from '@/components/marketing';
import { getTranslations } from 'next-intl/server';

const APP_ORDER = ['ramona', 'tuna', 'agave', 'saguaro', 'pita', 'cereus'] as const;

const GRADIENTS: Record<string, string> = {
  ramona: 'from-purple-500/20 to-pink-500/20',
  tuna: 'from-cyan-500/20 to-blue-500/20',
  agave: 'from-green-500/20 to-emerald-500/20',
  saguaro: 'from-teal-500/20 to-green-500/20',
  pita: 'from-lime-500/20 to-yellow-500/20',
  cereus: 'from-amber-500/20 to-yellow-900/20',
};

export default async function AppsMarketplacePage() {
  const t = await getTranslations('home.appsPage');

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-cactus-green/5 to-transparent">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cactus-green/10 rounded-full text-sm text-cactus-green mb-6">
            <Sparkles className="w-4 h-4" />
            <span>{t('badge')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Apps Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {APP_ORDER.map((appId) => {
              const app = APP_INFO[appId];
              const gradient = GRADIENTS[appId] || 'from-gray-500/20 to-gray-400/20';

              return (
                <div
                  key={app.id}
                  className={`relative rounded-2xl border overflow-hidden bg-gradient-to-br ${gradient} hover:shadow-lg transition-shadow`}
                >
                  <div className="p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={app.logo}
                          alt={app.name}
                          width={48}
                          height={48}
                          className="rounded-lg"
                        />
                        <div>
                          <h2 className="text-2xl font-display font-bold">{app.name}</h2>
                          <p className="text-sm text-muted-foreground">
                            {t(`apps.${appId}.tagline`)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-muted-foreground mb-6">
                      {t(`apps.${appId}.description`)}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className="px-3 py-1 text-xs rounded-full bg-background/80"
                          style={{ borderColor: app.color, borderWidth: 1 }}
                        >
                          {t(`apps.${appId}.features.${i}`)}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Link
                        href={app.demo}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                        style={{ backgroundColor: app.color }}
                      >
                        {t('tryDemo')}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href={app.landing}
                        className="px-4 py-2 rounded-lg text-sm font-medium border hover:bg-muted transition-colors"
                      >
                        {t('moreInfo')}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-cactus-green/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">
            {t('ctaTitle')}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            {t('ctaSubtitle')}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-6 py-3 bg-cactus-green text-white rounded-lg font-medium hover:bg-cactus-green/90 transition-colors"
            >
              {t('createAccount')}
            </Link>
            <Link
              href="/#contacto"
              className="px-6 py-3 border rounded-lg font-medium hover:bg-muted transition-colors"
            >
              {t('contact')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
