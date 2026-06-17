'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export interface QuickAction {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
}

/** Barra inferior de acciones rápidas — el "flujo de trabajo" común a las apps. */
export function QuickActionsBar({ actions, accent = '#0D6E4F' }: { actions: QuickAction[]; accent?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2.5">
      {actions.map((a) => {
        const inner = (
          <>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors group-hover:text-white"
              style={{ backgroundColor: accent + '14', color: accent }}
            >
              <a.icon className="h-4 w-4" />
            </span>
            <span className="text-xs font-medium text-foreground">{a.label}</span>
          </>
        );
        const cls = 'group inline-flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted';
        return a.href ? (
          <Link key={a.label} href={a.href} className={cls}>{inner}</Link>
        ) : (
          <button key={a.label} onClick={a.onClick} className={cls}>{inner}</button>
        );
      })}
    </div>
  );
}
