'use client';

// ═══════════════════════════════════════════════════════════════════════════
// CACTUS · Automatizaciones reutilizables (Bloque 7)
// Hook + panel que cualquier app de agente usa para tener automatizaciones
// que de verdad cambian el comportamiento (los toggles se leen con isOn()).
// Persisten en localStorage por agente; cero tablas nuevas.
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

export interface AutomationDef {
  id: string;
  name: string;
  desc: string;
  trigger: string;
  enabled: boolean;
}

export interface AutomationsApi {
  list: AutomationDef[];
  isOn: (id: string) => boolean;
  toggle: (id: string) => void;
  onCount: number;
}

/**
 * Estado de automatizaciones de un agente, persistido en localStorage.
 * `defs` es la lista por defecto (con su estado inicial). El estado guardado
 * solo sobreescribe el flag `enabled`, así puedes añadir nuevas automatizaciones
 * en el código sin romper las preferencias guardadas del usuario.
 */
export function useAutomations(agentSlug: string, defs: AutomationDef[]): AutomationsApi {
  const key = `cactus.${agentSlug}.automations.v1`;
  const [list, setList] = useState<AutomationDef[]>(defs);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, boolean>;
        setList(defs.map((d) => (d.id in saved ? { ...d, enabled: saved[d.id] } : d)));
      }
    } catch { /* noop */ }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      const map = Object.fromEntries(list.map((d) => [d.id, d.enabled]));
      localStorage.setItem(key, JSON.stringify(map));
    } catch { /* noop */ }
  }, [list, loaded, key]);

  const toggle = useCallback((id: string) => {
    setList((prev) => prev.map((d) => (d.id === id ? { ...d, enabled: !d.enabled } : d)));
  }, []);
  const isOn = useCallback((id: string) => list.find((d) => d.id === id)?.enabled ?? false, [list]);
  const onCount = list.filter((d) => d.enabled).length;

  return { list, isOn, toggle, onCount };
}

/** Panel completo de automatizaciones, listo para una vista de la app. */
export function AutomationsPanel({ autos, accent, title = 'Automatizaciones' }: { autos: AutomationsApi; accent: string; title?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-1 flex items-center gap-2">
        <Zap className="h-4 w-4" style={{ color: accent }} />
        <h3 className="font-display text-lg font-semibold">{title}</h3>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        {autos.onCount} de {autos.list.length} activas. Cambian el comportamiento del agente en tiempo real.
      </p>
      <div className="space-y-2.5">
        {autos.list.map((a) => (
          <div key={a.id} className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 transition-colors ${a.enabled ? 'border-border bg-muted/20' : 'border-dashed border-border'}`}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{a.name}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{a.trigger}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{a.desc}</p>
            </div>
            <AutoToggle on={a.enabled} accent={accent} onClick={() => autos.toggle(a.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AutoToggle({ on, accent, onClick }: { on: boolean; accent: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative h-5 w-9 shrink-0 rounded-full transition-colors" style={{ backgroundColor: on ? accent : 'rgb(148 163 184 / 0.4)' }} aria-pressed={on} aria-label={on ? 'Desactivar' : 'Activar'}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}
