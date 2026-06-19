'use client';

import { useEffect, useState } from 'react';
import { Markdown } from '@/components/cactus/shared/markdown';
import {
  LayoutDashboard, Users, UserCheck, Plus, Trash2, Loader2, Wand2, Copy, Check,
  Filter, Trophy, Percent, ClipboardList, Zap,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { QuickActionsBar } from '@/components/cactus/app-shell/quick-actions-bar';
import { DocAttach, withDoc, type Attached } from '@/components/cactus/apps/shared/doc-attach';
import { SubAgentBar } from '@/components/cactus/apps/shared/sub-agent-bar';
import { useAutomations, AutomationsPanel } from '@/components/cactus/apps/shared/automations';
import { defaultAutomationsFor } from '@/lib/cactus/automations-catalog';

interface OcotilloAgent { slug: string; name: string; role: string; color: string; image: string }

const STAGES = [
  { key: 'aplicaron', label: 'Aplicaron' },
  { key: 'filtro', label: 'Filtro' },
  { key: 'entrevista', label: 'Entrevista' },
  { key: 'oferta', label: 'Oferta' },
  { key: 'contratado', label: 'Contratado' },
  { key: 'descartado', label: 'Descartado' },
] as const;
type StageKey = (typeof STAGES)[number]['key'];
const ACTIVE: StageKey[] = ['aplicaron', 'filtro', 'entrevista', 'oferta'];

interface Cand { id: string; name: string; role: string; stage: StageKey; notes: string; createdAt: number }
const STORAGE = 'cactus.ocotillo.cands.v1';
const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

function useStored<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { try { const raw = localStorage.getItem(key); if (raw) setVal(JSON.parse(raw)); } catch { /* noop */ } setLoaded(true); }, [key]);
  useEffect(() => { if (loaded) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ } } }, [key, val, loaded]);
  return [val, setVal];
}

type View = 'resumen' | 'candidatos' | 'reclutador' | 'automatizaciones';

export function OcotilloApp({ agent, user, credits }: { agent: OcotilloAgent; user?: ShellUser; credits?: number }) {
  const [view, setView] = useState<View>('resumen');
  const [cands, setCands] = useStored<Cand[]>(STORAGE, []);
  const autos = useAutomations(agent.slug, defaultAutomationsFor(agent.slug));

  const hired = cands.filter((c) => c.stage === 'contratado').length;
  const rejected = cands.filter((c) => c.stage === 'descartado').length;
  const conv = hired + rejected > 0 ? Math.round((hired / (hired + rejected)) * 100) : 0;

  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [
    { key: 'resumen', label: 'Resumen', icon: LayoutDashboard },
    { key: 'candidatos', label: 'Candidatos', icon: Users },
    { key: 'reclutador', label: 'Reclutador IA', icon: ClipboardList },
    { key: 'automatizaciones', label: 'Automatizaciones', icon: Zap },
  ];
  const kpis: Kpi[] = [
    { label: 'Candidatos', value: cands.length, icon: <Users className="h-4 w-4" /> },
    { label: 'En proceso', value: cands.filter((c) => ACTIVE.includes(c.stage)).length, icon: <Filter className="h-4 w-4" /> },
    { label: 'Contratados', value: hired, icon: <Trophy className="h-4 w-4" /> },
    { label: 'Conversión', value: `${conv}%`, icon: <Percent className="h-4 w-4" /> },
  ];

  return (
    <AgentAppShell
      agent={agent} nav={nav} activeNav={view} onNav={(k) => setView(k as View)}
      user={user} credits={credits}
      greeting={`Hola${firstName ? `, ${firstName}` : ''} 🧑‍💼`}
      subtitle="Talento y reclutamiento con Ocotillo"
      cta={{ label: 'Agregar candidato', icon: Plus, onClick: () => setView('candidatos') }}
    >
      <KpiRow items={kpis} accent={agent.color} />
      {view === 'resumen' && <Resumen cands={cands} accent={agent.color} onGo={setView} />}
      {view === 'candidatos' && <Candidatos cands={cands} setCands={setCands} accent={agent.color} />}
      {view === 'reclutador' && <Reclutador agent={agent} />}
      {view === 'automatizaciones' && <AutomationsPanel autos={autos} accent={agent.color} />}
      <QuickActionsBar accent={agent.color} actions={[
        { label: 'Candidatos', icon: Users, onClick: () => setView('candidatos') },
        { label: 'Evaluar / preguntas', icon: ClipboardList, onClick: () => setView('reclutador') },
      ]} />
    </AgentAppShell>
  );
}

function Resumen({ cands, accent, onGo }: { cands: Cand[]; accent: string; onGo: (v: View) => void }) {
  const byStage = STAGES.map((s) => ({ ...s, count: cands.filter((c) => c.stage === s.key).length }));
  const max = Math.max(1, ...byStage.filter((s) => ACTIVE.includes(s.key as StageKey)).map((s) => s.count));
  const recent = [...cands].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 font-display text-lg font-semibold">Pipeline de selección</h3>
        {cands.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground"><Filter className="h-7 w-7 opacity-50" /><p className="text-sm">Agrega candidatos y sigue su avance por el embudo.</p><button onClick={() => onGo('candidatos')} className="mt-1 rounded-lg px-3.5 py-2 text-sm font-semibold text-white" style={{ backgroundColor: accent }}>Agregar candidato</button></div>
        ) : (
          <div className="space-y-2.5">
            {byStage.filter((s) => ACTIVE.includes(s.key as StageKey)).map((s) => (
              <div key={s.key}>
                <div className="mb-1 flex items-center justify-between text-xs"><span className="font-medium">{s.label}</span><span className="text-muted-foreground">{s.count}</span></div>
                <div className="h-6 w-full overflow-hidden rounded-lg bg-muted"><div className="flex h-full items-center rounded-lg px-2 text-[11px] font-semibold text-white" style={{ width: `${Math.max(8, (s.count / max) * 100)}%`, backgroundColor: accent }}>{s.count}</div></div>
              </div>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 pt-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-center"><div className="text-[11px] text-emerald-700">Contratados</div><div className="font-display font-bold text-emerald-700">{byStage.find((s) => s.key === 'contratado')!.count}</div></div>
              <div className="rounded-lg border border-border bg-muted/40 p-2 text-center"><div className="text-[11px] text-muted-foreground">Descartados</div><div className="font-display font-bold">{byStage.find((s) => s.key === 'descartado')!.count}</div></div>
            </div>
          </div>
        )}
      </div>
      <aside className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-display font-semibold">Candidatos recientes</h3>
        {recent.length === 0 ? <p className="text-sm text-muted-foreground">Aún no hay candidatos.</p> : (
          <ul className="space-y-2.5">{recent.map((c) => (<li key={c.id} className="flex items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: accent }}>{c.name.slice(0, 1).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{c.name}</span><span className="block truncate text-[11px] text-muted-foreground">{c.role || '—'} · {STAGES.find((s) => s.key === c.stage)!.label}</span></span></li>))}</ul>
        )}
      </aside>
    </div>
  );
}

function Candidatos({ cands, setCands, accent }: { cands: Cand[]; setCands: React.Dispatch<React.SetStateAction<Cand[]>>; accent: string }) {
  const [name, setName] = useState(''); const [role, setRole] = useState('');
  const add = () => { if (!name.trim()) return; setCands((p) => [{ id: uid(), name: name.trim(), role: role.trim(), stage: 'aplicaron', notes: '', createdAt: Date.now() }, ...p]); setName(''); setRole(''); };
  const move = (id: string, stage: StageKey) => setCands((p) => p.map((c) => (c.id === id ? { ...c, stage } : c)));
  const note = (id: string, notes: string) => setCands((p) => p.map((c) => (c.id === id ? { ...c, notes } : c)));
  const remove = (id: string) => setCands((p) => p.filter((c) => c.id !== id));
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del candidato" className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Puesto al que aplica" className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
          <button onClick={add} disabled={!name.trim()} className="inline-flex items-center justify-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: accent }}><Plus className="h-4 w-4" /> Agregar</button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {STAGES.map((s) => {
          const cs = cands.filter((c) => c.stage === s.key);
          return (
            <div key={s.key} className="rounded-xl border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold">{s.label}</span><span className="text-[11px] text-muted-foreground">{cs.length}</span></div>
              <div className="space-y-2">
                {cs.map((c) => (
                  <div key={c.id} className="rounded-lg border border-border bg-background p-2.5">
                    <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium">{c.name}</span><button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button></div>
                    <div className="truncate text-[11px] text-muted-foreground">{c.role || '—'}</div>
                    <input value={c.notes} onChange={(e) => note(c.id, e.target.value)} placeholder="Nota…" className="mt-1.5 w-full rounded border border-border bg-card px-2 py-1 text-[11px] focus:outline-none" />
                    <select value={c.stage} onChange={(e) => move(c.id, e.target.value as StageKey)} className="mt-1.5 w-full rounded-md border border-border bg-card px-1.5 py-1 text-[11px] focus:outline-none">{STAGES.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</select>
                  </div>
                ))}
                {cs.length === 0 && <p className="py-2 text-center text-[11px] text-muted-foreground/70">—</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Reclutador({ agent }: { agent: OcotilloAgent }) {
  const [role, setRole] = useState(''); const [cv, setCv] = useState(''); const [doc, setDoc] = useState<Attached | null>(null);
  const [loading, setLoading] = useState<'' | 'eval' | 'preg'>(''); const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<string | null>(null); const [copied, setCopied] = useState(false);
  const [subAgent, setSubAgent] = useState<string | null>(null);
  const c = agent.color;

  async function run(mode: 'eval' | 'preg') {
    if (loading) return;
    if (mode === 'eval' && !cv.trim() && !doc) { setError('Pega el CV/notas o adjunta el documento.'); return; }
    if (!role.trim()) { setError('Indica el puesto.'); return; }
    setLoading(mode); setError(null); setOut(null);
    const prompt = mode === 'eval'
      ? withDoc(`Eres reclutador. Evalúa el ajuste del candidato para el puesto "${role.trim()}".\nPerfil/CV/notas:\n"""${cv.trim() || '(ver documento adjunto)'}"""\nEntrega: 1) Resumen del perfil, 2) Fortalezas, 3) Brechas/riesgos, 4) Preguntas clave a indagar, 5) Recomendación (avanzar / con reservas / descartar) y por qué. Objetivo y justo, sin sesgos. Sin preámbulo.`, doc, 'CV / documento del candidato')
      : `Eres reclutador. Genera una guía de entrevista para el puesto "${role.trim()}": 8-10 preguntas (mezcla de experiencia, competencias, situacionales y de cultura), agrupadas por categoría, y qué buscar en una buena respuesta. Sin preámbulo.`;
    try {
      const res = await fetch('/api/cactus/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: agent.slug, subAgent, messages: [{ role: 'user', content: prompt }], maxTokens: 1400 }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setOut(String(data.content || '').trim());
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoading(''); }
  }
  async function copy() { if (!out) return; try { await navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ } }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-display text-lg font-semibold">Reclutador IA</h3>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Puesto</label>
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ej. Diseñador UX senior" className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        <label className="mb-1 block text-xs font-medium text-muted-foreground">CV / notas del candidato (para evaluar)</label>
        <textarea value={cv} onChange={(e) => setCv(e.target.value)} rows={4} placeholder="Pega el CV o experiencia…" className="mb-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        <div className="mb-3"><DocAttach accent={c} attached={doc} onChange={setDoc} label="Adjuntar CV (PDF/imagen)" /></div>
        <SubAgentBar slug={agent.slug} value={subAgent} onChange={setSubAgent} accent={c} />
        <div className="flex gap-2">
          <button onClick={() => run('eval')} disabled={loading !== ''} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: c }}>{loading === 'eval' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />} Evaluar</button>
          <button onClick={() => run('preg')} disabled={loading !== ''} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">{loading === 'preg' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Preguntas</button>
        </div>
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-semibold">Resultado</h3>{out && <button onClick={copy} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted">{copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copiar</button>}</div>
        {!out && loading === '' && <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground"><ClipboardList className="h-7 w-7 opacity-50" /><p className="max-w-xs text-sm">Evalúa el ajuste de un candidato o genera la guía de entrevista del puesto.</p></div>}
        {loading !== '' && <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Ocotillo está trabajando…</div>}
        {out && <Markdown text={out} className="text-sm leading-relaxed text-foreground/90" />}
      </div>
    </div>
  );
}
