'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import {
  AGENTS, DIVISIONS, DIVISION_ORDER, STATUS_LABEL, AGENTS_WITH_CARD,
  type CactusAgent, type DivisionKey,
} from '@/lib/cactus/agents-catalog';
import { CARD_META } from '@/lib/cactus/card-meta';

const STATUS_STYLE: Record<string, string> = {
  core: 'bg-emerald-500 text-white',
  live: 'bg-cactus-green text-white',
  beta: 'bg-amber-500 text-white',
  soon: 'bg-black/55 text-white',
};

function AgentCard({ agent }: { agent: CactusAgent }) {
  const operable = agent.status !== 'soon';
  const hasCard = AGENTS_WITH_CARD.has(agent.slug);

  const inner = (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border bg-white card-glow transition-all duration-300 hover:-translate-y-1 hover:border-transparent"
      style={{ ['--tw-shadow-color' as string]: agent.color + '40' }}
    >
      {hasCard ? (
        // Tarjeta completa, sin recortes (dimensiones reales → reserva espacio)
        <Image
          src={`/agents/${agent.slug}-card.png`}
          alt={agent.name}
          width={CARD_META[agent.slug]?.w || 1050}
          height={CARD_META[agent.slug]?.h || 1500}
          className="block h-auto w-full"
        />
      ) : (
        <div
          className="flex aspect-[3/4] flex-col items-center justify-center gap-3 p-6 text-center"
          style={{ background: `linear-gradient(160deg, ${agent.color}14, ${agent.color}05)` }}
        >
          <Image src={agent.image} alt={agent.name} width={88} height={88} className="rounded-2xl" />
          <div>
            <h3 className="font-display text-lg font-bold">{agent.name}</h3>
            <p className="text-sm font-medium" style={{ color: agent.color }}>{agent.role}</p>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-3">{agent.description}</p>
        </div>
      )}

      {/* Badge de estado */}
      <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow ${STATUS_STYLE[agent.status]}`}>
        {STATUS_LABEL[agent.status]}
      </span>

      {/* Hint al hover */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-black/55 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-white">
          {operable ? 'Abrir →' : <><Lock className="h-3.5 w-3.5" /> Próximamente</>}
        </span>
      </div>
    </div>
  );

  return agent.href ? <Link href={agent.href} className="block">{inner}</Link> : <div>{inner}</div>;
}

function Masonry({ items }: { items: CactusAgent[] }) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
      {items.map((a) => (
        <div key={a.slug} className="mb-4 break-inside-avoid">
          <AgentCard agent={a} />
        </div>
      ))}
    </div>
  );
}

export function AgentGrid() {
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
          Todos · {AGENTS.length}
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
              {d.label}
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
                  <h3 className="font-display font-semibold">{d.label}</h3>
                  <span className="hidden text-xs text-muted-foreground sm:inline">· {d.tagline}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
                </div>
                <Masonry items={items} />
              </section>
            );
          })}
        </div>
      ) : (
        <Masonry items={AGENTS.filter((a) => a.division === filter)} />
      )}
    </div>
  );
}
