import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveAgentMedia } from '@/lib/cactus/agent-images';
import { AGENTS, DIVISIONS, DIVISION_ORDER, AGENTS_WITH_CARD } from '@/lib/cactus/agents-catalog';

export default async function AppsMarketplacePage() {
  const t = await getTranslations('home.appsPage');
  const te = await getTranslations('ecosystem');

  // Foto + video efectivos de nivel global "Cactus" (página pública → sin empresa)
  const supabase = await createClient();
  const { images, videos } = supabase ? await getEffectiveAgentMedia(supabase, null) : { images: {}, videos: {} };

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

      {/* Tarjetas de agentes — automático desde el catálogo, agrupadas por división */}
      <section className="py-12">
        <div className="container mx-auto max-w-7xl space-y-12 px-4">
          {DIVISION_ORDER.map((key) => {
            const items = AGENTS.filter((a) => a.division === key);
            if (!items.length) return null;
            const d = DIVISIONS[key];
            return (
              <div key={key}>
                <div className="mb-5 flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full" style={{ backgroundColor: d.color }} />
                  <h2 className="font-display text-xl font-bold">{te(`divisions.${key}.label`)}</h2>
                  <span className="hidden text-sm text-muted-foreground sm:inline">· {te(`divisions.${key}.tagline`)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {items.map((a) => {
                    const operable = a.status !== 'soon';
                    const cardImg = images[a.slug] || (AGENTS_WITH_CARD.has(a.slug) ? `/agents/${a.slug}-card.png` : a.image);
                    const demo = a.href || `/agent/${a.slug}`;
                    const body = (
                      <>
                        <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-white">
                          {videos[a.slug]
                            ? <video src={videos[a.slug]} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-contain" />
                            : <Image src={cardImg} alt={a.name} fill sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw" className="object-contain" />}
                        </div>
                        <div className="mt-2.5 text-center">
                          <p className="font-display text-sm font-bold leading-tight">{a.name}</p>
                          <p className="text-[11px] font-medium" style={{ color: a.color }}>{te(`agents.${a.slug}.role`)}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{te(`agents.${a.slug}.description`)}</p>
                          <span
                            className={`mt-2 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${operable ? 'text-white' : 'bg-muted text-muted-foreground'}`}
                            style={operable ? { backgroundColor: a.color } : undefined}
                          >
                            {operable ? <>{t('tryDemo')} <ArrowRight className="h-3.5 w-3.5" /></> : 'Próximamente'}
                          </span>
                        </div>
                      </>
                    );
                    return operable
                      ? <Link key={a.slug} href={demo} className="block transition-transform duration-200 hover:-translate-y-0.5">{body}</Link>
                      : <div key={a.slug} className="opacity-90">{body}</div>;
                  })}
                </div>
              </div>
            );
          })}
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
