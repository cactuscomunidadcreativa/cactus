'use client';

// Indicador de empresa activa para el header de los agentes: "Estás en [X]".
// Autónomo: lee /api/cactus/companies; permite cambiar si hay más de una.

import { useEffect, useRef, useState } from 'react';
import { Building2, ChevronDown, Check, Loader2 } from 'lucide-react';

interface Company { id: string; name: string; role?: string }

export function CompanyBadge() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/cactus/companies');
        const d = await r.json();
        setCompanies(d.companies || []);
        setActiveId(d.activeId ?? d.companies?.[0]?.id ?? null);
      } catch { /* noop */ }
    })();
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (companies.length === 0) return null;
  const active = companies.find((c) => c.id === activeId) || companies[0];
  const single = companies.length === 1;

  async function switchTo(id: string) {
    if (id === active.id) { setOpen(false); return; }
    setBusy(id);
    try {
      const r = await fetch('/api/cactus/companies/active', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: id }),
      });
      if (r.ok) { window.location.reload(); return; }
    } catch { /* noop */ }
    setBusy(null); setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !single && setOpen((o) => !o)}
        title="Empresa activa"
        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 transition-colors hover:bg-muted disabled:opacity-60"
        disabled={!!busy}
      >
        <Building2 className="h-3.5 w-3.5 shrink-0 text-cactus-green" />
        <span className="hidden leading-tight sm:block">
          <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">Estás en</span>
          <span className="block max-w-[9rem] truncate text-xs font-semibold">{active.name}</span>
        </span>
        {!single && <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {open && !single && (
        <div className="absolute right-0 top-full z-50 mt-1 w-60 rounded-lg border border-border bg-popover py-1 shadow-lg">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cambiar de empresa</p>
          {companies.map((c) => (
            <button key={c.id} onClick={() => switchTo(c.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              {busy === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                : c.id === active.id ? <Check className="h-3.5 w-3.5 text-cactus-green" /> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
