'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Check, Loader2, Boxes, BadgeCheck } from 'lucide-react';

export interface CompanyRow {
  id: string;
  name: string;
  slug: string | null;
  role: string;
  brandCount: number;
  brands: string[];
}

const ACCENT = '#0D6E4F';

export function CompaniesManager({ companies, activeId }: { companies: CompanyRow[]; activeId: string | null }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    const n = name.trim();
    if (!n || creating) return;
    setCreating(true); setError(null);
    try {
      const res = await fetch('/api/cactus/companies/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: n }) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'No se pudo crear.');
      // Fija la nueva como activa y refresca
      if (data.company?.id) await fetch('/api/cactus/companies/active', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyId: data.company.id }) });
      setName('');
      router.refresh();
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setCreating(false); }
  }

  async function use(id: string) {
    if (switching || id === activeId) return;
    setSwitching(id); setError(null);
    try {
      const res = await fetch('/api/cactus/companies/active', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyId: id }) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'No se pudo cambiar.');
      router.refresh();
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setSwitching(null); }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-1 flex items-center gap-2">
        <Building2 className="h-4 w-4" style={{ color: ACCENT }} />
        <h2 className="font-display text-lg font-semibold">Mis empresas</h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">Una sola cuenta gestiona varias empresas. Cada una tiene su propio Cerebro y marcas; cambia entre ellas cuando quieras.</p>

      {/* Crear */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-3">
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') create(); }} placeholder="Nombre de la nueva empresa…" className="min-w-[180px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        <button onClick={create} disabled={creating || !name.trim()} className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: ACCENT }}>{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Crear empresa</button>
      </div>
      {error && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      {/* Lista */}
      {companies.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Aún no tienes empresas. Crea la primera arriba.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {companies.map((c) => {
            const active = c.id === activeId;
            return (
              <div key={c.id} className={`rounded-xl border p-4 ${active ? 'bg-emerald-50/40' : 'border-border bg-background'}`} style={active ? { borderColor: ACCENT } : undefined}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-display font-semibold">{c.name}</span>
                      {active && <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700"><BadgeCheck className="h-3 w-3" /> Activa</span>}
                    </div>
                    <div className="text-[11px] capitalize text-muted-foreground">{c.role}</div>
                  </div>
                  {!active && (
                    <button onClick={() => use(c.id)} disabled={switching !== null} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50">{switching === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Usar</button>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Boxes className="h-3.5 w-3.5" /> {c.brandCount} {c.brandCount === 1 ? 'marca' : 'marcas'}
                </div>
                {c.brands.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">{c.brands.slice(0, 5).map((b, i) => <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{b}</span>)}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
