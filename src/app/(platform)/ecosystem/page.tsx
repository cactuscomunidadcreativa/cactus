import Image from 'next/image';
import { AgentGrid } from '@/components/cactus/agent-grid';
import { AGENTS, DIVISION_ORDER } from '@/lib/cactus/agents-catalog';

export const metadata = {
  title: 'Ecosistema · Cactus Comunidad Creativa',
};

const liveCount = AGENTS.filter((a) => a.status !== 'soon').length;

export default function EcosystemPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#0D2B26] via-[#0D6E4F] to-[#0D2B26] text-white">
        <div className="grid items-center gap-6 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
          <div>
            <Image
              src="/cactus-ia-logo.png"
              alt="Cactus IA"
              width={56}
              height={56}
              className="mb-3 rounded-full bg-white/95 ring-1 ring-white/30"
            />
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
              Comunidad Creativa Inteligente
            </p>
            <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">
              Tu ecosistema. Todos los cactus, una sola misión.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-emerald-50/90">
              Un equipo de {AGENTS.length} agentes de IA especializados que trabajan juntos —
              y sienten— para hacer crecer tu negocio, tu marca y tus ideas.
            </p>
            <div className="mt-5 flex flex-wrap gap-6">
              {[
                { v: AGENTS.length, l: 'Agentes' },
                { v: DIVISION_ORDER.length, l: 'Divisiones' },
                { v: liveCount, l: 'Operables hoy' },
                { v: '+50', l: 'IAs integradas' },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-display text-2xl font-bold">{s.v}</div>
                  <div className="text-xs text-emerald-200/80">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative hidden aspect-[16/10] overflow-hidden rounded-xl ring-1 ring-white/10 md:block">
            <Image
              src="/agents/ecosystem-poster.png"
              alt="Mapa del ecosistema Cactus"
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 40vw"
              priority
            />
          </div>
        </div>
      </section>

      {/* Grid de agentes */}
      <section>
        <h2 className="mb-1 font-display text-xl font-semibold">Los cactus</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Cada agente se contrata por separado, en pack o como suscripción completa. Toca uno para abrirlo.
        </p>
        <AgentGrid />
      </section>
    </div>
  );
}
