'use client';

import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export interface Kpi {
  label: string;
  value: string | number;
  /** variación, ej. "+12.4%" */
  delta?: string;
  deltaDir?: 'up' | 'down';
  /** ícono ya renderizado, ej. <Users className="h-4 w-4" /> (server-safe) */
  icon?: ReactNode;
  hint?: string;
}

/** Fila de tarjetas de KPI — el bloque superior común a todas las apps de agente. */
export function KpiRow({ items, accent = '#0D6E4F' }: { items: Kpi[]; accent?: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {items.map((k) => (
        <KpiCard key={k.label} kpi={k} accent={accent} />
      ))}
    </div>
  );
}

export function KpiCard({ kpi, accent = '#0D6E4F' }: { kpi: Kpi; accent?: string }) {
  const { label, value, delta, deltaDir = 'up', icon, hint } = kpi;
  const down = deltaDir === 'down';
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-center justify-between">
        {icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: accent + '14', color: accent }}>
            {icon}
          </span>
        )}
        {delta && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${down ? 'text-red-500' : 'text-emerald-600'}`}>
            {down ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
            {delta}
          </span>
        )}
      </div>
      <div className="mt-2 font-display text-2xl font-bold leading-none">{value}</div>
      <div className="mt-1 truncate text-xs text-muted-foreground">{label}</div>
      {hint && <div className="mt-0.5 truncate text-[10px] text-muted-foreground/70">{hint}</div>}
    </div>
  );
}
