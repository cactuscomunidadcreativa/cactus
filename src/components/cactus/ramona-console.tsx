'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Sparkles, ArrowRight, Lock } from 'lucide-react';
import type { RamonaPlan } from '@/lib/cactus/ramona';

const EXAMPLES = [
  'Prepara el lanzamiento de ROWI',
  'Quiero más leads para mi consultoría',
  'Arma una campaña de temporada para mi tienda',
];

export function RamonaConsole() {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<RamonaPlan | null>(null);

  async function run(g?: string) {
    const theGoal = g ?? goal;
    if (!theGoal.trim()) return;
    setGoal(theGoal);
    setLoading(true); setError(null); setPlan(null);
    try {
      const res = await fetch('/api/cactus/ramona/plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: theGoal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setPlan(data.plan);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-3">
          <Image src="/agents/ramona.png" alt="Ramona" width={44} height={44} className="rounded-full ring-2 ring-purple-200" />
          <div>
            <h2 className="font-display font-semibold leading-tight">Ramona · Coordinadora</h2>
            <p className="text-xs text-muted-foreground">Dime tu objetivo. Yo armo el equipo.</p>
          </div>
        </div>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={2}
          placeholder="Ej: Prepara el lanzamiento de ROWI para líderes de RRHH…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-cactus-green focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => run(ex)} className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted/70">
              {ex}
            </button>
          ))}
          <button
            onClick={() => run()}
            disabled={loading || !goal.trim()}
            className="ml-auto flex items-center gap-2 rounded-md bg-cactus-green px-4 py-2 text-sm font-medium text-white hover:bg-cactus-green/90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'Pensando…' : 'Armar plan'}
          </button>
        </div>
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>

      {/* Plan */}
      {plan && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-700">{plan.intent}</span>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">{plan.summary}</p>

          <ol className="space-y-2">
            {plan.steps.map((s, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg border border-border p-2.5" style={{ borderLeftWidth: 3, borderLeftColor: s.color }}>
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">{i + 1}</span>
                <span className="text-lg">{s.emoji}</span>
                <div className="min-w-0 flex-1">
                  <span className="font-medium" style={{ color: s.color }}>{s.agentName}</span>
                  <span className="ml-2 text-sm text-muted-foreground">{s.action}</span>
                </div>
                {s.status === 'soon' && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Lock className="h-3 w-3" />pronto</span>}
              </li>
            ))}
          </ol>

          {plan.executable === 'campaign' && (
            <Link
              href="/campaign"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-cactus-green px-4 py-2 text-sm font-medium text-white hover:bg-cactus-green/90"
            >
              Ejecutar la campaña con Peyote <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
