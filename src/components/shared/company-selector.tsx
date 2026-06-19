'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, ChevronDown, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/components/shared/toast';

const SWITCH_KEY = 'cactus.companySwitched';

export interface CompanyOption {
  id: string;
  name: string;
  slug?: string | null;
  role?: string;
}

interface Props {
  companies: CompanyOption[];
  activeId: string | null;
}

/** Selector global de empresa (tenant) en el header. Degrada a nada si no hay empresas. */
export function CompanySelector({ companies, activeId }: Props) {
  const t = useTranslations('platform.companySelector');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { success } = useToast();

  useEffect(() => {
    try {
      const name = sessionStorage.getItem(SWITCH_KEY);
      if (name) { sessionStorage.removeItem(SWITCH_KEY); success(`Ahora estás en ${name}`); }
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!companies || companies.length === 0) return null;

  const active = companies.find((c) => c.id === activeId) || companies[0];

  async function switchTo(id: string) {
    if (id === active.id) { setOpen(false); return; }
    setBusy(id);
    try {
      const r = await fetch('/api/cactus/companies/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: id }),
      });
      if (r.ok) {
        try { sessionStorage.setItem(SWITCH_KEY, companies.find((c) => c.id === id)?.name || ''); } catch { /* noop */ }
        window.location.reload(); // recarga limpia: re-lee todo lo scopeado por empresa
        return;
      }
    } catch { /* noop */ }
    setBusy(null);
    setOpen(false);
  }

  const single = companies.length === 1;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !single && setOpen(!open)}
        title={t('label')}
        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-60"
        disabled={!!busy}
      >
        <Building2 className="h-4 w-4 shrink-0 text-cactus-green" />
        <span className="hidden leading-tight sm:block">
          <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">Estás en</span>
          <span className="block max-w-[10rem] truncate text-xs font-semibold">{active.name}</span>
        </span>
        {!single && <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {open && !single && (
        <div className="absolute right-0 top-full z-50 mt-1 w-60 rounded-md border border-border bg-popover py-1 shadow-lg">
          <p className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{t('label')}</p>
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => switchTo(c.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
            >
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              {busy === c.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : c.id === active.id ? (
                <Check className="h-3.5 w-3.5 text-cactus-green" />
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
