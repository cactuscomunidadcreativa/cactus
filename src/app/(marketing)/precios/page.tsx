import Link from 'next/link';
import { Check, Target, Users, Zap, CheckCircle2 } from 'lucide-react';
import { Reveal } from '@/components/marketing/motion';
import { PRICING_TIERS, PRICING_FAQ } from '@/lib/cactus/pricing';
import { AGENTS } from '@/lib/cactus/agents-catalog';

export const metadata = {
  title: 'Planes y precios · Cactus Comunidad Creativa',
  description: 'El ecosistema de IA que hace crecer tu negocio. Planes simples desde $0. Prueba gratis.',
};

const STEPS = [
  { icon: Target, title: 'Define tu objetivo', desc: 'Le dices a Ramona qué quieres lograr.' },
  { icon: Users, title: 'Ramona arma el equipo', desc: 'Elige los agentes-cactus y planifica.' },
  { icon: Zap, title: 'Los agentes ejecutan', desc: 'Trabajan en paralelo y generan entregables.' },
  { icon: CheckCircle2, title: 'Revisas y publicas', desc: 'Apruebas, ajustas y lanzas.' },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
      {/* Hero */}
      <Reveal className="text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-cactus-green">Planes simples · Valor real</p>
        <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
          El ecosistema de IA que hace crecer tu negocio, <span className="font-editorial italic text-cactus-green">en serio.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          {AGENTS.length} agentes que trabajan juntos — investigación, contenido, diseño, ventas y soporte — coordinados por Ramona.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="rounded-xl bg-cactus-green px-5 py-3 text-sm font-semibold text-white hover:bg-cactus-green/90">Probar gratis</Link>
          <Link href="/apps" className="rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:bg-muted">Ver los agentes</Link>
        </div>
      </Reveal>

      {/* Cómo funciona */}
      <section className="mt-20">
        <h2 className="mb-8 text-center font-display text-2xl font-bold md:text-3xl">Cómo funciona Cactus</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cactus-green/10 text-cactus-green"><s.icon className="h-5 w-5" /></span>
              <div className="mt-3 text-xs font-semibold text-muted-foreground">Paso {i + 1}</div>
              <h3 className="font-display font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Precios */}
      <section className="mt-20">
        <h2 className="mb-2 text-center font-display text-2xl font-bold md:text-3xl">Planes simples. Valor real.</h2>
        <p className="mb-8 text-center text-sm text-muted-foreground">Empieza gratis y crece cuando lo necesites.</p>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {PRICING_TIERS.map((t) => (
            <div
              key={t.key}
              className={`relative flex flex-col rounded-2xl border bg-card p-5 ${t.featured ? 'border-cactus-green shadow-lg ring-1 ring-cactus-green/30' : 'border-border'}`}
            >
              {t.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cactus-green px-3 py-0.5 text-[11px] font-semibold text-white">Más popular</span>
              )}
              <h3 className="font-display text-lg font-bold">{t.name}</h3>
              <p className="text-xs text-muted-foreground">{t.tagline}</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="font-display text-3xl font-bold">{t.price}</span>
                {t.period && <span className="mb-1 text-sm text-muted-foreground">{t.period}</span>}
              </div>
              <ul className="mt-4 flex-1 space-y-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cactus-green" /> <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={t.cta.href}
                className={`mt-5 rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${t.featured ? 'bg-cactus-green text-white hover:bg-cactus-green/90' : 'border border-border hover:bg-muted'}`}
              >
                {t.cta.label}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-20 max-w-3xl">
        <h2 className="mb-8 text-center font-display text-2xl font-bold md:text-3xl">Preguntas frecuentes</h2>
        <div className="space-y-3">
          {PRICING_FAQ.map((f) => (
            <div key={f.q} className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-medium">{f.q}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
