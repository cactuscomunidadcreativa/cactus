'use client';

import { useEffect, useState } from 'react';
import { Markdown } from '@/components/cactus/shared/markdown';
import {
  LayoutDashboard, Filter, FileText, Plus, Trash2, Loader2, Wand2, Copy, Check,
  DollarSign, Target, Trophy, Percent, Briefcase,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { QuickActionsBar } from '@/components/cactus/app-shell/quick-actions-bar';
import { DocAttach, withDoc, type Attached } from '@/components/cactus/apps/shared/doc-attach';

interface MagueyAgent { slug: string; name: string; role: string; color: string; image: string }

const STAGES = [
  { key: 'prospecto', label: 'Prospecto' },
  { key: 'calificado', label: 'Calificado' },
  { key: 'propuesta', label: 'Propuesta' },
  { key: 'negociacion', label: 'Negociación' },
  { key: 'ganado', label: 'Ganado' },
  { key: 'perdido', label: 'Perdido' },
] as const;
type StageKey = (typeof STAGES)[number]['key'];
const STAGE = Object.fromEntries(STAGES.map((s) => [s.key, s])) as Record<StageKey, (typeof STAGES)[number]>;
const OPEN: StageKey[] = ['prospecto', 'calificado', 'propuesta', 'negociacion'];

interface Deal { id: string; name: string; company: string; value: number; stage: StageKey; createdAt: number }
const STORAGE = 'cactus.maguey.deals.v1';
const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
const money = (n: number) => `$${n.toLocaleString('es-MX')}`;

function useStored<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { try { const raw = localStorage.getItem(key); if (raw) setVal(JSON.parse(raw)); } catch { /* noop */ } setLoaded(true); }, [key]);
  useEffect(() => { if (loaded) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ } } }, [key, val, loaded]);
  return [val, setVal];
}

type View = 'resumen' | 'pipeline' | 'propuestas';

export function MagueyApp({ agent, user, credits }: { agent: MagueyAgent; user?: ShellUser; credits?: number }) {
  const [view, setView] = useState<View>('resumen');
  const [deals, setDeals] = useStored<Deal[]>(STORAGE, []);

  const open = deals.filter((d) => OPEN.includes(d.stage));
  const pipelineValue = open.reduce((s, d) => s + d.value, 0);
  const won = deals.filter((d) => d.stage === 'ganado');
  const lost = deals.filter((d) => d.stage === 'perdido');
  const conv = won.length + lost.length > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;

  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [
    { key: 'resumen', label: 'Resumen', icon: LayoutDashboard },
    { key: 'pipeline', label: 'Pipeline', icon: Filter },
    { key: 'propuestas', label: 'Propuestas', icon: FileText },
    { key: 'crm', label: 'CRM (Tuna)', icon: Briefcase, href: '/apps/tuna', section: 'Conecta' },
  ];
  const kpis: Kpi[] = [
    { label: 'Pipeline abierto', value: money(pipelineValue), icon: <DollarSign className="h-4 w-4" /> },
    { label: 'Ganado', value: money(won.reduce((s, d) => s + d.value, 0)), icon: <Trophy className="h-4 w-4" /> },
    { label: 'Tratos', value: deals.length, icon: <Target className="h-4 w-4" /> },
    { label: 'Conversión', value: `${conv}%`, icon: <Percent className="h-4 w-4" /> },
  ];

  return (
    <AgentAppShell
      agent={agent} nav={nav} activeNav={view}
      onNav={(k) => { if (k !== 'crm') setView(k as View); }}
      user={user} credits={credits}
      greeting={`Hola${firstName ? `, ${firstName}` : ''} 💰`}
      subtitle="Ventas y propuestas con Maguey"
      cta={{ label: 'Nuevo trato', icon: Plus, onClick: () => setView('pipeline') }}
    >
      <KpiRow items={kpis} accent={agent.color} />
      {view === 'resumen' && <Resumen deals={deals} accent={agent.color} onGo={setView} />}
      {view === 'pipeline' && <Pipeline deals={deals} setDeals={setDeals} accent={agent.color} />}
      {view === 'propuestas' && <Propuestas agent={agent} deals={deals} />}
      <QuickActionsBar accent={agent.color} actions={[
        { label: 'Pipeline', icon: Filter, onClick: () => setView('pipeline') },
        { label: 'Nueva propuesta', icon: FileText, onClick: () => setView('propuestas') },
        { label: 'Abrir CRM Tuna', icon: Briefcase, href: '/apps/tuna' },
      ]} />
    </AgentAppShell>
  );
}

function Resumen({ deals, accent, onGo }: { deals: Deal[]; accent: string; onGo: (v: View) => void }) {
  const byStage = STAGES.map((s) => { const ds = deals.filter((d) => d.stage === s.key); return { ...s, count: ds.length, value: ds.reduce((a, b) => a + b.value, 0) }; });
  const maxCount = Math.max(1, ...byStage.filter((s) => OPEN.includes(s.key as StageKey)).map((s) => s.count));
  const recent = [...deals].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 font-display text-lg font-semibold">Embudo de ventas</h3>
        {deals.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <Filter className="h-7 w-7 opacity-50" />
            <p className="text-sm">Agrega tus tratos en el Pipeline y mira aquí tu embudo.</p>
            <button onClick={() => onGo('pipeline')} className="mt-1 rounded-lg px-3.5 py-2 text-sm font-semibold text-white" style={{ backgroundColor: accent }}>Ir al Pipeline</button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {byStage.filter((s) => OPEN.includes(s.key as StageKey)).map((s) => (
              <div key={s.key}>
                <div className="mb-1 flex items-center justify-between text-xs"><span className="font-medium">{s.label}</span><span className="text-muted-foreground">{s.count} · {money(s.value)}</span></div>
                <div className="h-6 w-full overflow-hidden rounded-lg bg-muted"><div className="flex h-full items-center rounded-lg px-2 text-[11px] font-semibold text-white" style={{ width: `${Math.max(8, (s.count / maxCount) * 100)}%`, backgroundColor: accent }}>{s.count}</div></div>
              </div>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 pt-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-center"><div className="text-[11px] text-emerald-700">Ganado</div><div className="font-display font-bold text-emerald-700">{byStage.find((s) => s.key === 'ganado')!.count}</div></div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-center"><div className="text-[11px] text-red-600">Perdido</div><div className="font-display font-bold text-red-600">{byStage.find((s) => s.key === 'perdido')!.count}</div></div>
            </div>
          </div>
        )}
      </div>

      <aside className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-display font-semibold">Tratos recientes</h3>
        {recent.length === 0 ? <p className="text-sm text-muted-foreground">Aún no hay tratos.</p> : (
          <ul className="space-y-2.5">
            {recent.map((d) => (
              <li key={d.id} className="min-w-0">
                <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium">{d.name}</span><span className="shrink-0 text-sm font-semibold" style={{ color: accent }}>{money(d.value)}</span></div>
                <div className="text-[11px] text-muted-foreground">{d.company} · {STAGE[d.stage].label}</div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function Pipeline({ deals, setDeals, accent }: { deals: Deal[]; setDeals: React.Dispatch<React.SetStateAction<Deal[]>>; accent: string }) {
  const [name, setName] = useState(''); const [company, setCompany] = useState(''); const [value, setValue] = useState('');
  const add = () => { if (!name.trim()) return; setDeals((p) => [{ id: uid(), name: name.trim(), company: company.trim(), value: Number(value) || 0, stage: 'prospecto', createdAt: Date.now() }, ...p]); setName(''); setCompany(''); setValue(''); };
  const move = (id: string, stage: StageKey) => setDeals((p) => p.map((d) => (d.id === id ? { ...d, stage } : d)));
  const remove = (id: string) => setDeals((p) => p.filter((d) => d.id !== id));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_140px_auto]">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Trato / oportunidad" className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Empresa / cliente" className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
          <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Valor $" className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
          <button onClick={add} disabled={!name.trim()} className="inline-flex items-center justify-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: accent }}><Plus className="h-4 w-4" /> Agregar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {STAGES.map((s) => {
          const ds = deals.filter((d) => d.stage === s.key);
          const total = ds.reduce((a, b) => a + b.value, 0);
          return (
            <div key={s.key} className="rounded-xl border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold">{s.label}</span><span className="text-[11px] text-muted-foreground">{ds.length} · {money(total)}</span></div>
              <div className="space-y-2">
                {ds.map((d) => (
                  <div key={d.id} className="rounded-lg border border-border bg-background p-2.5">
                    <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium">{d.name}</span><span className="shrink-0 text-xs font-semibold" style={{ color: accent }}>{money(d.value)}</span></div>
                    <div className="truncate text-[11px] text-muted-foreground">{d.company}</div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <select value={d.stage} onChange={(e) => move(d.id, e.target.value as StageKey)} className="flex-1 rounded-md border border-border bg-card px-1.5 py-1 text-[11px] focus:outline-none">
                        {STAGES.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
                      </select>
                      <button onClick={() => remove(d.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
                {ds.length === 0 && <p className="py-2 text-center text-[11px] text-muted-foreground/70">—</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Propuestas({ agent, deals }: { agent: MagueyAgent; deals: Deal[] }) {
  const [dealId, setDealId] = useState('');
  const [extra, setExtra] = useState('');
  const [doc, setDoc] = useState<Attached | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const c = agent.color;
  const deal = deals.find((d) => d.id === dealId);

  async function generate() {
    if (loading) return;
    setLoading(true); setError(null); setOut(null);
    const base = deal
      ? `Trato: ${deal.name}. Cliente: ${deal.company || '[cliente]'}. Valor estimado: ${money(deal.value)}.`
      : 'Propuesta comercial general.';
    const prompt = withDoc(
      `Redacta una propuesta comercial profesional en español.\n${base}\nNotas: ${extra.trim() || 'ninguna'}.\n` +
      `Estructura: 1) Resumen ejecutivo, 2) Entendimiento de la necesidad, 3) Solución/alcance, 4) Beneficios, ` +
      `5) Inversión y condiciones, 6) Próximos pasos. Persuasiva y clara, con campos [ ] donde falten datos. Sin preámbulo.`,
      doc, 'Apóyate en este material del cliente',
    );
    try {
      const res = await fetch('/api/cactus/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: agent.slug, messages: [{ role: 'user', content: prompt }], maxTokens: 1800 }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setOut(String(data.content || '').trim());
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoading(false); }
  }
  async function copy() { if (!out) return; try { await navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ } }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-display text-lg font-semibold">Generar propuesta</h3>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Trato (opcional)</label>
        <select value={dealId} onChange={(e) => setDealId(e.target.value)} className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none">
          <option value="">— Sin trato / general —</option>
          {deals.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.company}</option>)}
        </select>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Notas / contexto</label>
        <textarea value={extra} onChange={(e) => setExtra(e.target.value)} rows={3} placeholder="Qué necesita el cliente, diferenciadores, plazos…" className="mb-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        <div className="mb-3"><DocAttach accent={c} attached={doc} onChange={setDoc} label="Adjuntar brief del cliente" /></div>
        <button onClick={generate} disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: c }}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generar propuesta</button>
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-semibold">Propuesta</h3>{out && <button onClick={copy} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted">{copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copiar</button>}</div>
        {!out && !loading && <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground"><FileText className="h-7 w-7 opacity-50" /><p className="max-w-xs text-sm">Elige un trato o describe el contexto y Maguey redacta la propuesta.</p></div>}
        {loading && <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Redactando…</div>}
        {out && <Markdown text={out} className="text-sm leading-relaxed text-foreground/90" />}
      </div>
    </div>
  );
}
