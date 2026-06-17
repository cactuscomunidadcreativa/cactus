'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import {
  AGENTS, DIVISIONS, DIVISION_ORDER, AGENTS_WITH_CARD,
  type CactusAgent, type DivisionKey,
} from '@/lib/cactus/agents-catalog';
import { Stagger, StaggerItem } from '@/components/marketing/motion';

// Cada cactus flota con una fase distinta para que la grilla se vea viva
const floatClass = 'motion-safe:animate-cactus-float motion-safe:group-hover:animate-cactus-wiggle';

const STATUS_STYLE: Record<string, string> = {
  core: 'bg-emerald-500 text-white',
  live: 'bg-cactus-green text-white',
  beta: 'bg-amber-500 text-white',
  soon: 'bg-black/55 text-white',
};

function AgentCard({ agent, index = 0 }: { agent: CactusAgent; index?: number }) {
  const t = useTranslations('ecosystem');
  const operable = agent.status !== 'soon';
  const hasCard = AGENTS_WITH_CARD.has(agent.slug);
  // Desfase de la flotación: cada cactus arranca en un momento distinto
  const floatStyle = { animationDelay: `${(index % 6) * 0.45}s` };

  const inner = (
    <div
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-white card-glow transition-all duration-300 hover:-translate-y-1 hover:border-transparent"
      style={{ ['--tw-shadow-color' as string]: agent.color + '40' }}
    >
      {hasCard ? (
        // Tarjeta completa, tamaño uniforme y sin recortar (object-contain)
        <Image
          src={`/agents/${agent.slug}-card.png`}
          alt={agent.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-contain ${floatClass}`}
          style={floatStyle}
        />
      ) : (
        <div
          className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
          style={{ background: `linear-gradient(160deg, ${agent.color}14, ${agent.color}05)` }}
        >
          <Image src={agent.image} alt={agent.name} width={88} height={88} className={`rounded-2xl ${floatClass}`} style={floatStyle} />
          <div>
            <h3 className="font-display text-lg font-bold">{agent.name}</h3>
            <p className="text-sm font-medium" style={{ color: agent.color }}>{t(`agents.${agent.slug}.role`)}</p>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-3">{t(`agents.${agent.slug}.description`)}</p>
        </div>
      )}

      {/* Badge de estado */}
      <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow ${STATUS_STYLE[agent.status]}`}>
        {t(`status.${agent.status}`)}
      </span>

      {/* Hint al hover */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-black/55 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-white">
          {operable ? `${t('grid.open')} →` : <><Lock className="h-3.5 w-3.5" /> {t('grid.soon')}</>}
        </span>
      </div>
    </div>
  );

  return agent.href ? <Link href={agent.href} className="block">{inner}</Link> : <div>{inner}</div>;
}

function Grid({ items }: { items: CactusAgent[] }) {
  return (
    <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((a, i) => (
        <StaggerItem key={a.slug}>
          <AgentCard agent={a} index={i} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function AgentGrid() {
  const t = useTranslations('ecosystem');
  const [filter, setFilter] = useState<DivisionKey | 'all'>('all');

  return (
    <div>
      {/* Filtros por división */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === 'all' ? 'bg-cactus-green text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'
          }`}
        >
          {t('grid.all')} · {AGENTS.length}
        </button>
        {DIVISION_ORDER.map((key) => {
          const d = DIVISIONS[key];
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              style={active ? { backgroundColor: d.color, color: 'white' } : { backgroundColor: d.color + '14', color: d.color }}
            >
              {t(`divisions.${key}.label`)}
            </button>
          );
        })}
      </div>

      {filter === 'all' ? (
        <div className="space-y-10">
          {DIVISION_ORDER.map((key) => {
            const items = AGENTS.filter((a) => a.division === key);
            if (!items.length) return null;
            const d = DIVISIONS[key];
            return (
              <section key={key}>
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full" style={{ backgroundColor: d.color }} />
                  <h3 className="font-display font-semibold">{t(`divisions.${key}.label`)}</h3>
                  <span className="hidden text-xs text-muted-foreground sm:inline">· {t(`divisions.${key}.tagline`)}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
                </div>
                <Grid items={items} />
              </section>
            );
          })}
        </div>
      ) : (
        <Grid items={AGENTS.filter((a) => a.division === filter)} />
      )}
    </div>
  );
}
