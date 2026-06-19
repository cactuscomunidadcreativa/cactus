'use client';

import { useEffect, useState } from 'react';
import { Check, Wallet } from 'lucide-react';
import { BUDGET_TIERS, BUDGET_COOKIE, DEFAULT_TIER, isBudgetTier, type BudgetTier } from '@/lib/cactus/budget';

const LS_KEY = 'cactus.budget.tier';

/** Selector de presupuesto: el usuario elige un perfil y la plataforma escoge el modelo de IA. */
export function BudgetSettings() {
  const [tier, setTier] = useState<BudgetTier>(DEFAULT_TIER);

  useEffect(() => {
    try {
      const fromCookie = document.cookie.split('; ').find((c) => c.startsWith(`${BUDGET_COOKIE}=`))?.split('=')[1];
      const stored = localStorage.getItem(LS_KEY);
      const v = fromCookie || stored;
      if (isBudgetTier(v)) setTier(v);
    } catch { /* noop */ }
  }, []);

  function choose(next: BudgetTier) {
    setTier(next);
    try {
      localStorage.setItem(LS_KEY, next);
      // Cookie de 1 año: el router de IA del server la lee para elegir modelo.
      document.cookie = `${BUDGET_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    } catch { /* noop */ }
  }

  return (
    <section className="mb-6 rounded-lg border border-border bg-card p-6">
      <h2 className="mb-1 flex items-center gap-2 font-semibold"><Wallet className="h-4 w-4" /> Presupuesto de IA</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Elige cuánto quieres gastar. La plataforma seleccionará automáticamente los modelos de IA acordes en todos los agentes.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {BUDGET_TIERS.map((t) => {
          const active = t.key === tier;
          return (
            <button
              key={t.key}
              onClick={() => choose(t.key)}
              className={`relative rounded-xl border p-4 text-left transition-colors ${active ? 'border-cactus-green bg-cactus-green/5' : 'border-border hover:bg-muted'}`}
            >
              {active && <Check className="absolute right-3 top-3 h-4 w-4 text-cactus-green" />}
              <div className="text-2xl">{t.emoji}</div>
              <div className="mt-1 font-display font-semibold">{t.label}</div>
              <div className="mt-0.5 text-[11px] font-medium text-muted-foreground">{t.costHint}</div>
              <p className="mt-2 text-xs text-muted-foreground">{t.desc}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
