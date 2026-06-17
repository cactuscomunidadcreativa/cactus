'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Lock } from 'lucide-react';
import { Stagger, StaggerItem } from '@/components/marketing/motion';
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
  const operable = agent.status !== 'soon';

  const inner = (
    <div
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card card-glow transition-all duration-300 hover:-translate-y-1 hover:border-transparent"
      style={{ ['--tw-shadow-color' as string]: agent.color + '33' }}
    >
      {/* franja de acento */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${agent.color}, ${agent.color}00)` }} />

      <div className="flex items-start gap-3 p-4">
        <div
          className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl ring-2 transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundColor: agent.color + '12', ['--tw-ring-color' as string]: agent.color + '33' }}
        >
          <Image src={agent.image} alt={agent.name} fill className="object-cover" sizes="56px" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold leading-tight">{agent.name}</h3>
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${STATUS_STYLE[agent.status]}`}>
              {STATUS_LABEL[agent.status]}
            </span>
          </div>
          <p className="text-xs font-medium" style={{ color: agent.color }}>{agent.role}</p>
        </div>
        {operable ? (
          <span
            className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border opacity-0 transition-all duration-300 group-hover:opacity-100"
            style={{ borderColor: agent.color + '40', color: agent.color }}
          >
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        ) : (
          <Lock className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/50" />
        )}
      </div>

      <p className="px-4 text-sm leading-relaxed text-muted-foreground line-clamp-2">{agent.description}</p>

      <div className="mt-auto flex flex-wrap items-center gap-1 p-4 pt-3">
        {agent.tools.slice(0, 3).map((t) => (
          <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
        ))}
        <span className="ml-auto text-[10px] text-muted-foreground/70">{division.label}</span>
      </div>
    </div>
  );

  return agent.href ? <Link href={agent.href} className="block h-full">{inner}</Link> : <div className="h-full">{inner}</div>;
}

export function AgentGrid() {
  const [filter, setFilter] = useState<DivisionKey | 'all'>('all');
  const visible = filter === 'all' ? AGENTS : AGENTS.filter((a) => a.division === filter);

  const gridClass = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

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
                <Stagger className={gridClass}>
                  {items.map((a) => (
                    <StaggerItem key={a.slug} className="h-full">
                      <AgentCard agent={a} />
                    </StaggerItem>
                  ))}
                </Stagger>
              </section>
            );
          })}
        </div>
      ) : (
        <Stagger className={gridClass}>
          {visible.map((agent) => (
            <StaggerItem key={agent.slug} className="h-full">
              <AgentCard agent={agent} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
