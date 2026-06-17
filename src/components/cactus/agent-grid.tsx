'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import {
  AGENTS, DIVISIONS, DIVISION_ORDER, STATUS_LABEL,
  type CactusAgent, type DivisionKey,
} from '@/lib/cactus/agents-catalog';

const STATUS_STYLE: Record<string, string> = {
  core: 'bg-emerald-100 text-emerald-700',
  live: 'bg-cactus-green/15 text-cactus-green',
  beta: 'bg-amber-100 text-amber-700',
  soon: 'bg-muted text-muted-foreground',
};

function AgentCard({ agent }: { agent: CactusAgent }) {
  const division = DIVISIONS[agent.division];
  const operable = agent.status === 'live' || agent.status === 'beta' || agent.status === 'core';

  const inner = (
    <div
      className="group relative flex h-full flex-col rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
      style={{ borderTopWidth: 3, borderTopColor: agent.color }}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden ring-2"
          style={{ backgroundColor: agent.color + '12', ['--tw-ring-color' as string]: agent.color + '30' }}
        >
          <Image src={agent.image} alt={agent.name} fill className="object-cover" sizes="64px" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold leading-tight">{agent.name}</h3>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STATUS_STYLE[agent.status]}`}>
              {STATUS_LABEL[agent.status]}
            </span>
          </div>
          <p className="text-xs font-medium" style={{ color: agent.color }}>{agent.role}</p>
        </div>
      </div>

      <p className="px-4 text-sm text-muted-foreground line-clamp-3">{agent.description}</p>

      <div className="mt-3 flex flex-wrap gap-1 px-4">
        {agent.tools.slice(0, 3).map((t) => (
          <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between p-4 pt-3">
        <span className="text-[11px] text-muted-foreground">{division.label}</span>
        {operable ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-cactus-green opacity-0 transition-opacity group-hover:opacity-100">
            Abrir <ArrowRight className="h-3 w-3" />
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" /> Pronto
          </span>
        )}
      </div>
    </div>
  );

  return agent.href ? (
    <Link href={agent.href} className="block h-full">{inner}</Link>
  ) : (
    inner
  );
}

export function AgentGrid() {
  const [filter, setFilter] = useState<DivisionKey | 'all'>('all');
  const visible = filter === 'all' ? AGENTS : AGENTS.filter((a) => a.division === filter);

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
              style={active
                ? { backgroundColor: d.color, color: 'white' }
                : { backgroundColor: d.color + '14', color: d.color }}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {filter === 'all' ? (
        <div className="space-y-8">
          {DIVISION_ORDER.map((key) => {
            const items = AGENTS.filter((a) => a.division === key);
            if (!items.length) return null;
            const d = DIVISIONS[key];
            return (
              <section key={key}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full" style={{ backgroundColor: d.color }} />
                  <h3 className="font-display font-semibold">{d.label}</h3>
                  <span className="hidden text-xs text-muted-foreground sm:inline">· {d.tagline}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((a) => <AgentCard key={a.slug} agent={a} />)}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((agent) => <AgentCard key={agent.slug} agent={agent} />)}
        </div>
      )}
    </div>
  );
}
