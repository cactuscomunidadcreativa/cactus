'use client';

// Explorador de agentes (barra unificada): buscador instantáneo + atajo a
// Ramona + recientes + categorías plegables. Se abre cuando quieres cambiar de
// agente; no abruma con 27 nombres a la vez.

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, X, ChevronDown, ChevronRight, Sparkles, LayoutGrid,
  Megaphone, Palette, Globe, Briefcase, Users, type LucideIcon,
} from 'lucide-react';
import {
  NAV_CATEGORIES, agentsOfCategory, allNavAgents, type NavAgentLite,
} from '@/lib/cactus/nav-taxonomy';

const CAT_ICON: Record<string, LucideIcon> = {
  Megaphone, Palette, Globe, Briefcase, Users,
};

const RECENTS_KEY = 'cactus.nav.recents.v1';

export function recordRecent(slug: string) {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const prev: string[] = raw ? JSON.parse(raw) : [];
    const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, 5);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch { /* noop */ }
}

export function AgentBrowser({ activeSlug, onPick }: { activeSlug?: string; onPick?: () => void }) {
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<NavAgentLite[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {};
    NAV_CATEGORIES.forEach((c) => { o[c.key] = false; });
    return o;
  });

  const all = useMemo(() => allNavAgents(), []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      const slugs: string[] = raw ? JSON.parse(raw) : [];
      setRecents(slugs.map((s) => all.find((a) => a.slug === s)).filter((a): a is NavAgentLite => !!a));
    } catch { /* noop */ }
    // si hay agente activo, abre su categoría
    if (activeSlug) {
      const cat = NAV_CATEGORIES.find((c) => c.slugs.includes(activeSlug));
      if (cat) setOpen((o) => ({ ...o, [cat.key]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = query.trim().toLowerCase();
  const results = q ? all.filter((a) => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)) : [];

  function pick(slug: string) { recordRecent(slug); onPick?.(); }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Buscador + Ramona */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca un agente o di qué necesitas…"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-8 text-sm focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Limpiar">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {q ? (
          <div className="space-y-1">
            {results.map((a) => <AgentRow key={a.slug} a={a} active={a.slug === activeSlug} onPick={() => pick(a.slug)} />)}
            <Link href={`/orchestrator?ask=${encodeURIComponent(query)}`} onClick={onPick}
              className="mt-1 flex items-center gap-2.5 rounded-lg border border-dashed border-border px-2.5 py-2.5 text-sm text-muted-foreground hover:bg-muted">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7E3FF2]/15 text-[#7E3FF2]"><Sparkles className="h-3.5 w-3.5" /></span>
              Pregúntale a Ramona: “{query}”
            </Link>
            {results.length === 0 && <p className="px-1 py-6 text-center text-xs text-muted-foreground">Nada con ese nombre. Prueba con Ramona ↑</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {recents.length > 0 && (
              <div>
                <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Recientes</p>
                <div className="space-y-1">
                  {recents.map((a) => <AgentRow key={a.slug} a={a} active={a.slug === activeSlug} onPick={() => pick(a.slug)} />)}
                </div>
              </div>
            )}

            {NAV_CATEGORIES.map((cat) => {
              const Icon = CAT_ICON[cat.icon] || LayoutGrid;
              const agents = agentsOfCategory(cat.key);
              const isOpen = open[cat.key];
              return (
                <div key={cat.key}>
                  <button onClick={() => setOpen((o) => ({ ...o, [cat.key]: !o[cat.key] }))}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium hover:bg-muted">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: cat.color + '1f', color: cat.color }}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex-1 text-left">{cat.label}</span>
                    <span className="text-[10px] text-muted-foreground">{agents.length}</span>
                    {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {isOpen && (
                    <div className="mt-0.5 space-y-0.5 pl-1">
                      {agents.map((a) => <AgentRow key={a.slug} a={a} active={a.slug === activeSlug} onPick={() => pick(a.slug)} />)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AgentRow({ a, active, onPick }: { a: NavAgentLite; active?: boolean; onPick: () => void }) {
  return (
    <Link href={a.href} onClick={onPick}
      className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors ${active ? 'font-medium' : 'hover:bg-muted'}`}
      style={active ? { backgroundColor: a.color + '14' } : undefined}>
      <Image src={a.image} alt={a.name} width={26} height={26} className="rounded-full" style={active ? { boxShadow: `0 0 0 2px ${a.color}` } : undefined} />
      <span className="min-w-0 flex-1 truncate text-sm" style={active ? { color: a.color } : undefined}>{a.name}</span>
      <span className="truncate text-[10px] text-muted-foreground">{a.role}</span>
    </Link>
  );
}
