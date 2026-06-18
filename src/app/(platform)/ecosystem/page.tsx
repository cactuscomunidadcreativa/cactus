import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { AgentGrid } from '@/components/cactus/agent-grid';
import { Reveal, Counter } from '@/components/marketing/motion';
import { AGENTS, DIVISION_ORDER } from '@/lib/cactus/agents-catalog';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { getEffectiveAgentMedia } from '@/lib/cactus/agent-images';

export const metadata = {
  title: 'Ecosistema · Cactus Comunidad Creativa',
};

const liveCount = AGENTS.filter((a) => a.status !== 'soon').length;

export default async function EcosystemPage() {
  const t = await getTranslations('ecosystem');

  // Foto + video efectivos (empresa sobre global) para reflejar los cambios del editor
  const supabase = await createClient();
  let images: Record<string, string> = {};
  let videos: Record<string, string> = {};
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    const companyId = user ? await getActiveCompanyId(supabase, user.id) : null;
    const media = await getEffectiveAgentMedia(supabase, companyId);
    images = media.images; videos = media.videos;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[#0A241F] via-[#0D6E4F] to-[#0A241F] text-white">
        {/* glow decorativo */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative grid items-center gap-6 p-7 md:grid-cols-[1.1fr_0.9fr] md:p-10">
          <Reveal>
            <Image
              src="/cactus-ia-logo.png"
              alt="Cactus IA"
              width={56}
              height={56}
              className="mb-4 rounded-full bg-white/95 ring-1 ring-white/30"
            />
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
              {t('hero.eyebrow')}
            </p>
            <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-tight md:text-5xl">
              {t('hero.titleLead')}{' '}
              <span className="font-editorial font-medium italic text-emerald-300">{t('hero.titleAccent')}</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-emerald-50/85 md:text-base">
              {t.rich('hero.intro', {
                count: AGENTS.length,
                feel: (chunks) => <em className="font-editorial">{chunks}</em>,
              })}
            </p>
            <div className="mt-7 flex flex-wrap gap-x-8 gap-y-4">
              {[
                { v: AGENTS.length, suffix: '', l: t('stats.agents') },
                { v: DIVISION_ORDER.length, suffix: '', l: t('stats.divisions') },
                { v: liveCount, suffix: '', l: t('stats.liveToday') },
                { v: 50, suffix: '+', l: t('stats.aisIntegrated') },
              ].map((s) => (
                <div key={s.l}>
                  <Counter value={s.v} suffix={s.suffix} className="font-display text-3xl font-bold" />
                  <div className="text-xs text-emerald-200/80">{s.l}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15} className="relative mx-auto hidden aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-white/95 p-3 ring-1 ring-white/15 md:block">
            <Image
              src="/cactus-logo.png"
              alt="Cactus Comunidad Creativa"
              fill
              className="object-contain transition-transform duration-700 hover:scale-105"
              sizes="(max-width: 768px) 100vw, 40vw"
              priority
            />
          </Reveal>
        </div>
      </section>

      {/* Grid de agentes */}
      <section>
        <Reveal>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-cactus-green">{t('team.eyebrow')}</p>
          <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            {t('team.title')}
          </h2>
          <p className="mb-7 mt-2 max-w-2xl text-sm text-muted-foreground">
            {t('team.subtitle')}
          </p>
        </Reveal>
        <AgentGrid images={images} videos={videos} />
      </section>
    </div>
  );
}
