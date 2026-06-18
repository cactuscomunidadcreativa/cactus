'use client';

import { useEffect, useState } from 'react';
import {
  LayoutDashboard, FolderOpen, ScanText, Plus, Trash2, Loader2, Wand2, Copy, Check,
  ShieldAlert, FileWarning, ClipboardCheck,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { QuickActionsBar } from '@/components/cactus/app-shell/quick-actions-bar';
import { DocAttach, withDoc, type Attached } from '@/components/cactus/apps/shared/doc-attach';

interface HuerniaAgent { slug: string; name: string; role: string; color: string; image: string }

const TYPES = ['Contrato', 'NDA', 'Laboral', 'Mercantil', 'Compliance', 'Otro'];
type Status = 'abierto' | 'en_revision' | 'cerrado';
type Risk = 'bajo' | 'medio' | 'alto';
const STATUS: Record<Status, { label: string; cls: string }> = {
  abierto: { label: 'Abierto', cls: 'bg-sky-100 text-sky-700' },
  en_revision: { label: 'En revisión', cls: 'bg-amber-100 text-amber-700' },
  cerrado: { label: 'Cerrado', cls: 'bg-emerald-100 text-emerald-700' },
};
const RISK: Record<Risk, { label: string; cls: string }> = {
  bajo: { label: 'Bajo', cls: 'bg-emerald-100 text-emerald-700' },
  medio: { label: 'Medio', cls: 'bg-amber-100 text-amber-700' },
  alto: { label: 'Alto', cls: 'bg-red-100 text-red-700' },
};

interface Caso { id: string; title: string; type: string; status: Status; risk: Risk; notes: string; createdAt: number }
const STORAGE = 'cactus.huernia.casos.v1';
const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
const NOTE = 'Huernia es asistencia legal preliminar con IA, no asesoría jurídica. Valida con un abogado antes de actuar.';

function useStored<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { try { const raw = localStorage.getItem(key); if (raw) setVal(JSON.parse(raw)); } catch { /* noop */ } setLoaded(true); }, [key]);
  useEffect(() => { if (loaded) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ } } }, [key, val, loaded]);
  return [val, setVal];
}

type View = 'resumen' | 'expedientes' | 'revisar';

export function HuerniaApp({ agent, user, credits }: { agent: HuerniaAgent; user?: ShellUser; credits?: number }) {
  const [view, setView] = useState<View>('resumen');
  const [casos, setCasos] = useStored<Caso[]>(STORAGE, []);

  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [
    { key: 'resumen', label: 'Resumen', icon: LayoutDashboard },
    { key: 'expedientes', label: 'Expedientes', icon: FolderOpen },
    { key: 'revisar', label: 'Revisar documento', icon: ScanText },
  ];
  const kpis: Kpi[] = [
    { label: 'Expedientes', value: casos.length, icon: <FolderOpen className="h-4 w-4" /> },
    { label: 'En revisión', value: casos.filter((c) => c.status === 'en_revision').length, icon: <ClipboardCheck className="h-4 w-4" /> },
    { label: 'Riesgo alto', value: casos.filter((c) => c.risk === 'alto').length, icon: <ShieldAlert className="h-4 w-4" /> },
    { label: 'Cerrados', value: casos.filter((c) => c.status === 'cerrado').length, icon: <Check className="h-4 w-4" /> },
  ];

  return (
    <AgentAppShell
      agent={agent} nav={nav} activeNav={view} onNav={(k) => setView(k as View)}
      user={user} credits={credits}
      greeting={`Hola${firstName ? `, ${firstName}` : ''} ⚖️`}
      subtitle="Legal y compliance con Huernia"
      cta={{ label: 'Revisar documento', icon: ScanText, onClick: () => setView('revisar') }}
    >
      <KpiRow items={kpis} accent={agent.color} />
      {view === 'resumen' && <Resumen casos={casos} accent={agent.color} onGo={setView} />}
      {view === 'expedientes' && <Expedientes casos={casos} setCasos={setCasos} accent={agent.color} />}
      {view === 'revisar' && <Revisar agent={agent} />}
      <QuickActionsBar accent={agent.color} actions={[
        { label: 'Expedientes', icon: FolderOpen, onClick: () => setView('expedientes') },
        { label: 'Revisar documento', icon: ScanText, onClick: () => setView('revisar') },
        { label: 'Generar contrato (Ferocactus)', icon: FileWarning, href: '/apps/ferocactus' },
      ]} />
    </AgentAppShell>
  );
}

function Resumen({ casos, accent, onGo }: { casos: Caso[]; accent: string; onGo: (v: View) => void }) {
  const byStatus = (Object.keys(STATUS) as Status[]).map((s) => ({ s, count: casos.filter((c) => c.status === s).length }));
  const byRisk = (Object.keys(RISK) as Risk[]).map((r) => ({ r, count: casos.filter((c) => c.risk === r).length }));
  const recent = [...casos].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 font-display font-semibold">Expedientes por estado</h3>
            {casos.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">Sin expedientes.</p> : (
              <div className="space-y-2">{byStatus.map(({ s, count }) => (<div key={s} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS[s].cls}`}>{STATUS[s].label}</span><span className="font-semibold">{count}</span></div>))}</div>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 font-display font-semibold">Riesgos por nivel</h3>
            {casos.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">Sin datos.</p> : (
              <div className="space-y-2">{byRisk.map(({ r, count }) => (<div key={r} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${RISK[r].cls}`}>{RISK[r].label}</span><span className="font-semibold">{count}</span></div>))}</div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-display text-lg font-semibold">Expedientes recientes</h3>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground"><FolderOpen className="h-7 w-7 opacity-50" /><p className="text-sm">Crea expedientes o revisa un documento con IA.</p><button onClick={() => onGo('expedientes')} className="mt-1 rounded-lg px-3.5 py-2 text-sm font-semibold text-white" style={{ backgroundColor: accent }}>Nuevo expediente</button></div>
          ) : (
            <ul className="space-y-2">{recent.map((c) => (<li key={c.id} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2"><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{c.title}</span><span className="block truncate text-[11px] text-muted-foreground">{c.type}</span></span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${RISK[c.risk].cls}`}>{RISK[c.risk].label}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS[c.status].cls}`}>{STATUS[c.status].label}</span></li>))}</ul>
          )}
        </div>
      </div>
      <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-center gap-2 text-sm font-medium text-amber-800"><ShieldAlert className="h-4 w-4" /> Aviso</div><p className="mt-1.5 text-[11px] leading-relaxed text-amber-900">{NOTE}</p></aside>
    </div>
  );
}

function Expedientes({ casos, setCasos, accent }: { casos: Caso[]; setCasos: React.Dispatch<React.SetStateAction<Caso[]>>; accent: string }) {
  const [title, setTitle] = useState(''); const [type, setType] = useState(TYPES[0]);
  const add = () => { if (!title.trim()) return; setCasos((p) => [{ id: uid(), title: title.trim(), type, status: 'abierto', risk: 'bajo', notes: '', createdAt: Date.now() }, ...p]); setTitle(''); };
  const upd = (id: string, patch: Partial<Caso>) => setCasos((p) => p.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id: string) => setCasos((p) => p.filter((c) => c.id !== id));
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del expediente" className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none">{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          <button onClick={add} disabled={!title.trim()} className="inline-flex items-center justify-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: accent }}><Plus className="h-4 w-4" /> Crear</button>
        </div>
      </div>
      {casos.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground"><FolderOpen className="mx-auto mb-2 h-7 w-7 opacity-50" /><p className="text-sm">Sin expedientes todavía.</p></div>
      ) : (
        <div className="space-y-2">
          {[...casos].sort((a, b) => b.createdAt - a.createdAt).map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{c.title}</div><div className="text-[11px] text-muted-foreground">{c.type}</div></div>
              <select value={c.risk} onChange={(e) => upd(c.id, { risk: e.target.value as Risk })} className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none">{(Object.keys(RISK) as Risk[]).map((r) => <option key={r} value={r}>Riesgo {RISK[r].label.toLowerCase()}</option>)}</select>
              <select value={c.status} onChange={(e) => upd(c.id, { status: e.target.value as Status })} className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none">{(Object.keys(STATUS) as Status[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}</select>
              <button onClick={() => remove(c.id)} className="rounded-md p-1.5 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Revisar({ agent }: { agent: HuerniaAgent }) {
  const [text, setText] = useState(''); const [doc, setDoc] = useState<Attached | null>(null);
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<string | null>(null); const [copied, setCopied] = useState(false);
  const c = agent.color;

  async function review() {
    if (loading) return;
    if (!text.trim() && !doc) { setError('Pega el texto o adjunta el documento a revisar.'); return; }
    setLoading(true); setError(null); setOut(null);
    const prompt = withDoc(
      `Eres asistente legal (no abogado). Revisa este documento/contrato:\n"""${text.trim() || '(ver documento adjunto)'}"""\n` +
      `Entrega: 1) Tipo y partes (si se identifican), 2) Cláusulas de riesgo o desbalanceadas, 3) Puntos faltantes o ambiguos, ` +
      `4) Obligaciones y plazos clave, 5) Nivel de riesgo general (bajo/medio/alto) y por qué, 6) Recomendaciones. ` +
      `Prudente y claro. Cierra recordando validar con un abogado. Sin preámbulo.`,
      doc, 'Documento a revisar',
    );
    try {
      const res = await fetch('/api/cactus/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: agent.slug, messages: [{ role: 'user', content: prompt }], maxTokens: 1600 }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setOut(String(data.content || '').trim());
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoading(false); }
  }
  async function copy() { if (!out) return; try { await navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ } }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-2 flex items-center gap-2"><ScanText className="h-4 w-4" style={{ color: c }} /><h3 className="font-display font-semibold">Revisar documento</h3></div>
        <p className="mb-3 text-sm text-muted-foreground">Sube un contrato (PDF/imagen) o pega el texto. Huernia detecta riesgos y faltantes.</p>
        <div className="mb-2"><DocAttach accent={c} attached={doc} onChange={setDoc} label="Subir documento (PDF/imagen)" /></div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="…o pega aquí el texto del documento" className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        <button onClick={review} disabled={loading} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: c }}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Revisar con Huernia</button>
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        <p className="mt-3 inline-flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-700"><ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {NOTE}</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-semibold">Revisión</h3>{out && <button onClick={copy} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted">{copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copiar</button>}</div>
        {!out && !loading && <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground"><ScanText className="h-7 w-7 opacity-50" /><p className="max-w-xs text-sm">El análisis de riesgos aparecerá aquí.</p></div>}
        {loading && <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Revisando…</div>}
        {out && <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{out}</div>}
      </div>
    </div>
  );
}
