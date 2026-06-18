'use client';

import { useEffect, useState } from 'react';
import { Markdown } from '@/components/cactus/shared/markdown';
import Link from 'next/link';
import {
  LayoutDashboard, KeyRound, FileText, ScanSearch, Plus, Trash2, Loader2, Wand2, Copy, Check,
  TrendingUp, Lock, Gauge, Hash,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { QuickActionsBar } from '@/components/cactus/app-shell/quick-actions-bar';
import { DocAttach, withDoc, type Attached } from '@/components/cactus/apps/shared/doc-attach';

interface EchiAgent { slug: string; name: string; role: string; color: string; image: string }

interface Kw { id: string; text: string; intent: string }
interface Content { id: string; kw: string; content: string; createdAt: number }
const KW_KEY = 'cactus.echinocereus.kw.v1';
const CT_KEY = 'cactus.echinocereus.content.v1';
const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

function useStored<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { try { const raw = localStorage.getItem(key); if (raw) setVal(JSON.parse(raw)); } catch { /* noop */ } setLoaded(true); }, [key]);
  useEffect(() => { if (loaded) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ } } }, [key, val, loaded]);
  return [val, setVal];
}

type View = 'resumen' | 'keywords' | 'contenido' | 'auditoria';

export function EchinocereusApp({ agent, user, credits }: { agent: EchiAgent; user?: ShellUser; credits?: number }) {
  const [view, setView] = useState<View>('resumen');
  const [kws, setKws] = useStored<Kw[]>(KW_KEY, []);
  const [contents, setContents] = useStored<Content[]>(CT_KEY, []);

  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [
    { key: 'resumen', label: 'Resumen', icon: LayoutDashboard },
    { key: 'keywords', label: 'Keywords', icon: KeyRound },
    { key: 'contenido', label: 'Contenido SEO', icon: FileText },
    { key: 'auditoria', label: 'Auditoría', icon: ScanSearch },
    { key: 'gsc', label: 'Search Console', icon: TrendingUp, href: '/empresa', section: 'Conecta' },
  ];
  const kpis: Kpi[] = [
    { label: 'Keywords', value: kws.length, icon: <KeyRound className="h-4 w-4" /> },
    { label: 'Contenidos', value: contents.length, icon: <FileText className="h-4 w-4" /> },
    { label: 'Tráfico orgánico', value: '—', icon: <TrendingUp className="h-4 w-4" />, hint: 'Conecta Search Console' },
    { label: 'Posición media', value: '—', icon: <Gauge className="h-4 w-4" />, hint: 'Conecta Search Console' },
  ];

  return (
    <AgentAppShell
      agent={agent} nav={nav} activeNav={view}
      onNav={(k) => { if (k !== 'gsc') setView(k as View); }}
      user={user} credits={credits}
      greeting={`Hola${firstName ? `, ${firstName}` : ''} 📈`}
      subtitle="SEO y crecimiento con Echinocereus"
      cta={{ label: 'Buscar keywords', icon: KeyRound, onClick: () => setView('keywords') }}
    >
      <KpiRow items={kpis} accent={agent.color} />
      {view === 'resumen' && <Resumen kws={kws} accent={agent.color} onGo={setView} />}
      {view === 'keywords' && <Keywords agent={agent} kws={kws} setKws={setKws} />}
      {view === 'contenido' && <Contenido agent={agent} kws={kws} onSave={(c) => setContents((p) => [c, ...p])} />}
      {view === 'auditoria' && <Auditoria agent={agent} />}
      <QuickActionsBar accent={agent.color} actions={[
        { label: 'Keywords', icon: KeyRound, onClick: () => setView('keywords') },
        { label: 'Brief de contenido', icon: FileText, onClick: () => setView('contenido') },
        { label: 'Auditar página', icon: ScanSearch, onClick: () => setView('auditoria') },
        { label: 'Construir web (Opuntia)', icon: Hash, href: '/apps/opuntia' },
      ]} />
    </AgentAppShell>
  );
}

function Resumen({ kws, accent, onGo }: { kws: Kw[]; accent: string; onGo: (v: View) => void }) {
  const byIntent = ['informacional', 'transaccional', 'navegacional', 'comercial'].map((i) => ({ i, count: kws.filter((k) => k.intent.toLowerCase().includes(i)).length })).filter((x) => x.count > 0);
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" style={{ color: accent }} /><h3 className="font-display font-semibold">Rendimiento orgánico</h3></div>
          <div className="relative overflow-hidden rounded-xl border border-dashed border-border bg-muted/20">
            <svg viewBox="0 0 400 120" className="h-32 w-full opacity-30" preserveAspectRatio="none" aria-hidden><polyline fill="none" stroke={accent} strokeWidth="2" points="0,100 60,90 120,70 180,72 240,50 300,40 360,30 400,22" /></svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/40 px-6 text-center backdrop-blur-[1px]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"><Lock className="h-4 w-4" /></span>
              <p className="max-w-xs text-xs text-muted-foreground">Conecta Google Search Console para ver tráfico, clics, impresiones y posición reales.</p>
              <Link href="/empresa" className="text-xs font-semibold" style={{ color: accent }}>Conectar Search Console →</Link>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-display text-lg font-semibold">Tus keywords</h3>
          {kws.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground"><KeyRound className="h-7 w-7 opacity-50" /><p className="text-sm">Investiga keywords y planifica tu contenido para posicionar.</p><button onClick={() => onGo('keywords')} className="mt-1 rounded-lg px-3.5 py-2 text-sm font-semibold text-white" style={{ backgroundColor: accent }}>Buscar keywords</button></div>
          ) : (
            <div className="flex flex-wrap gap-1.5">{kws.slice(0, 30).map((k) => <span key={k.id} className="rounded-full border border-border px-2.5 py-1 text-xs">{k.text} <span className="text-[10px] text-muted-foreground">· {k.intent}</span></span>)}</div>
          )}
        </div>
      </div>
      <aside className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-2 font-display font-semibold">Por intención</h3>
          {byIntent.length === 0 ? <p className="text-sm text-muted-foreground">Sin datos aún.</p> : (
            <div className="space-y-2">{byIntent.map(({ i, count }) => (<div key={i} className="flex items-center justify-between text-sm"><span className="capitalize">{i}</span><span className="font-semibold">{count}</span></div>))}</div>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-2 font-display font-semibold">Cómo trabaja Echinocereus</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <Step n={1} accent={accent}>Investiga keywords por intención.</Step>
            <Step n={2} accent={accent}>Crea briefs de contenido optimizados.</Step>
            <Step n={3} accent={accent}>Audita páginas y prioriza mejoras.</Step>
            <Step n={4} accent={accent}>Pasa el plan a Opuntia y Pitaya.</Step>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Step({ n, accent, children }: { n: number; accent: string; children: React.ReactNode }) {
  return (<li className="flex items-start gap-2.5"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: accent }}>{n}</span><span className="text-foreground/80">{children}</span></li>);
}

function Keywords({ agent, kws, setKws }: { agent: EchiAgent; kws: Kw[]; setKws: React.Dispatch<React.SetStateAction<Kw[]>> }) {
  const [topic, setTopic] = useState(''); const [manual, setManual] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  const c = agent.color;

  const addManual = () => { const t = manual.trim(); if (!t) return; setKws((p) => [{ id: uid(), text: t, intent: 'manual' }, ...p]); setManual(''); };
  const remove = (id: string) => setKws((p) => p.filter((k) => k.id !== id));

  async function ideas() {
    const t = topic.trim(); if (!t || loading) return;
    setLoading(true); setError(null);
    const prompt = `Eres especialista SEO. Genera 12 ideas de keywords para el tema "${t}". Una por línea con el formato exacto: keyword — intención (informacional/transaccional/comercial/navegacional). Sin numeración ni preámbulo.`;
    try {
      const res = await fetch('/api/cactus/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: agent.slug, messages: [{ role: 'user', content: prompt }], maxTokens: 800 }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      const items = String(data.content || '').split('\n').map((l) => l.replace(/^[-*\d.)\s]+/, '').trim()).filter(Boolean).map((l) => {
        const [text, intent] = l.split(/—|\-|:/).map((x) => x.trim());
        return { id: uid(), text: text || l, intent: (intent || 'informacional').toLowerCase() };
      });
      setKws((p) => [...items, ...p]);
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoading(false); }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-display text-lg font-semibold">Investigar keywords</h3>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Tema / negocio</label>
        <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={2} placeholder="Ej. zapatos veganos a domicilio en México" className="mb-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        <button onClick={ideas} disabled={loading || !topic.trim()} className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: c }}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generar ideas</button>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">o agrega una manual</label>
        <div className="flex items-center gap-2"><input value={manual} onChange={(e) => setManual(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addManual(); }} placeholder="keyword…" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /><button onClick={addManual} className="inline-flex items-center rounded-lg px-3 py-2 text-white" style={{ backgroundColor: c }}><Plus className="h-4 w-4" /></button></div>
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-display text-lg font-semibold">Lista de keywords <span className="text-sm font-normal text-muted-foreground">({kws.length})</span></h3>
        {kws.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Genera ideas o agrega keywords manualmente.</p> : (
          <div className="space-y-1.5">{kws.map((k) => (<div key={k.id} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"><span className="flex-1 text-sm">{k.text}</span><span className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize text-muted-foreground">{k.intent}</span><button onClick={() => remove(k.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button></div>))}</div>
        )}
      </div>
    </div>
  );
}

function Contenido({ agent, kws, onSave }: { agent: EchiAgent; kws: Kw[]; onSave: (c: Content) => void }) {
  const [kw, setKw] = useState(''); const [doc, setDoc] = useState<Attached | null>(null);
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<string | null>(null); const [copied, setCopied] = useState(false);
  const c = agent.color;

  async function generate() {
    const k = kw.trim(); if (!k || loading) return;
    setLoading(true); setError(null); setOut(null);
    const prompt = withDoc(
      `Eres estratega de contenido SEO. Crea un brief para un artículo que posicione por la keyword "${k}".\n` +
      `Incluye: 3 opciones de título (con la keyword), meta descripción (máx 155 caracteres), intención de búsqueda, ` +
      `estructura con H2/H3 sugeridos, keywords secundarias a incluir, preguntas a responder (PAA) y extensión recomendada. Sin preámbulo.`,
      doc, 'Considera este material de referencia',
    );
    try {
      const res = await fetch('/api/cactus/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: agent.slug, messages: [{ role: 'user', content: prompt }], maxTokens: 1400 }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setOut(String(data.content || '').trim());
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoading(false); }
  }
  async function copy() { if (!out) return; try { await navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ } }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-display text-lg font-semibold">Brief de contenido</h3>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Keyword objetivo</label>
        <input value={kw} onChange={(e) => setKw(e.target.value)} list="echi-kws" placeholder="Ej. mejores zapatos veganos" className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        <datalist id="echi-kws">{kws.map((k) => <option key={k.id} value={k.text} />)}</datalist>
        <div className="mb-3"><DocAttach accent={c} attached={doc} onChange={setDoc} label="Adjuntar referencia" /></div>
        <button onClick={generate} disabled={loading || !kw.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: c }}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generar brief</button>
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-semibold">Brief</h3>{out && <div className="flex items-center gap-1.5"><button onClick={copy} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted">{copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copiar</button><button onClick={() => onSave({ id: uid(), kw: kw.trim(), content: out, createdAt: Date.now() })} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: c }}><Check className="h-3.5 w-3.5" /> Guardar</button></div>}</div>
        {!out && !loading && <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground"><FileText className="h-7 w-7 opacity-50" /><p className="max-w-xs text-sm">Elige una keyword y Echinocereus arma el brief SEO.</p></div>}
        {loading && <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generando…</div>}
        {out && <Markdown text={out} className="text-sm leading-relaxed text-foreground/90" />}
      </div>
    </div>
  );
}

function Auditoria({ agent }: { agent: EchiAgent }) {
  const [text, setText] = useState(''); const [doc, setDoc] = useState<Attached | null>(null);
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<string | null>(null); const [copied, setCopied] = useState(false);
  const c = agent.color;

  async function audit() {
    if (loading) return;
    if (!text.trim() && !doc) { setError('Pega el contenido de la página o adjunta el documento.'); return; }
    setLoading(true); setError(null); setOut(null);
    const prompt = withDoc(
      `Eres auditor SEO on-page. Analiza este contenido/página:\n"""${text.trim() || '(ver documento adjunto)'}"""\n` +
      `Evalúa: título y meta descripción, encabezados (H1/H2), uso e intención de keywords, legibilidad, enlaces internos/externos, ` +
      `y oportunidades. Entrega una lista PRIORIZADA de mejoras (de mayor a menor impacto) y un puntaje SEO 0-100 con justificación. Sin preámbulo.`,
      doc, 'Contenido de la página',
    );
    try {
      const res = await fetch('/api/cactus/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: agent.slug, messages: [{ role: 'user', content: prompt }], maxTokens: 1400 }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setOut(String(data.content || '').trim());
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoading(false); }
  }
  async function copy() { if (!out) return; try { await navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ } }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-2 flex items-center gap-2"><ScanSearch className="h-4 w-4" style={{ color: c }} /><h3 className="font-display font-semibold">Auditoría on-page</h3></div>
        <p className="mb-3 text-sm text-muted-foreground">Pega el contenido de tu página (o súbelo) y Echinocereus la audita.</p>
        <div className="mb-2"><DocAttach accent={c} attached={doc} onChange={setDoc} label="Subir página / documento" /></div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="…o pega aquí el texto/HTML de la página" className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        <button onClick={audit} disabled={loading} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: c }}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Auditar</button>
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-semibold">Resultado</h3>{out && <button onClick={copy} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted">{copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copiar</button>}</div>
        {!out && !loading && <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground"><Gauge className="h-7 w-7 opacity-50" /><p className="max-w-xs text-sm">La auditoría con mejoras priorizadas y puntaje aparecerá aquí.</p></div>}
        {loading && <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Auditando…</div>}
        {out && <Markdown text={out} className="text-sm leading-relaxed text-foreground/90" />}
      </div>
    </div>
  );
}
