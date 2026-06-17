'use client';

import { AgentGrid } from '@/components/cactus/agent-grid';
import { AGENTS, DIVISION_ORDER, DIVISIONS } from '@/lib/cactus/agents-catalog';

export function AgentsAdmin() {
  const operables = AGENTS.filter((a) => a.status !== 'soon').length;
  const soon = AGENTS.filter((a) => a.status === 'soon').length;
  const reuse = AGENTS.filter((a) => a.reuses).length;

  const stats = [
    { v: AGENTS.length, l: 'Agentes totales' },
    { v: operables, l: 'Operables hoy' },
    { v: reuse, l: 'Reusan módulos' },
    { v: soon, l: 'Por construir' },
    { v: DIVISION_ORDER.length, l: 'Divisiones' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Ecosistema de agentes</h2>
        <p className="text-sm text-muted-foreground">
          Los 27 cactus. Desde aquí controlas qué está vivo, qué reusa un módulo existente y qué falta construir.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.l} className="rounded-lg border border-border bg-card p-3">
            <div className="font-display text-2xl font-bold">{s.v}</div>
            <div className="text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Divisiones resumen */}
      <div className="flex flex-wrap gap-2">
        {DIVISION_ORDER.map((k) => {
          const d = DIVISIONS[k];
          const count = AGENTS.filter((a) => a.division === k).length;
          return (
            <span key={k} className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: d.color + '14', color: d.color }}>
              {d.label} · {count}
            </span>
          );
        })}
      </div>

      <AgentGrid />
    </div>
  );
}
