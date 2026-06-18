'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Search, Microscope, Plug, Wand2, Loader2, Copy, Check, Trash2,
  ChevronDown, BarChart3, Radar, Lightbulb, FileSearch, Sparkles,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { QuickActionsBar } from '@/components/cactus/app-shell/quick-actions-bar';
import { DocAttach, withDoc, type Attached } from '@/components/cactus/apps/shared/doc-attach';

interface BiznagaAgent { slug: string; name: string; role: string; color: string; image: string }

// ── Tipos de investigación (master spec: research, sources, benchmark) ────────
const KINDS = [
  { key: 'competencia', label: 'Análisis de competencia' },
  { key: 'mercado', label: 'Tamaño y mercado' },
  { key: 'tendencias', label: 'Tendencias' },
  { key: 'benchmark', label: 'Benchmark' },
  { key: 'pricing', label: 'Pricing externo' },
] as const;
type KindKey = (typeof KINDS)[number]['key'];
const KIND = Object.fromEntries(KINDS.map((k) => [k.key, k])) as Record<KindKey, (typeof KINDS)[number]>;

interface Research {
  id: string;
  kind: KindKey;
  topic: string;
  sector: string;
  content: string;
  createdAt: number;
}

const STORAGE_KEY = 'cactus.biznaga.research.v1';
const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

type View = 'resumen' | 'investigar' | 'investigaciones';

export function BiznagaApp({
  agent, user, credits,
}: {
  agent: BiznagaAgent; user?: ShellUser; credits?: number;
}) {
  const [view, setView] = useState<View>('resumen');
  const [items, setItems] = useState<Research[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setItems(JSON.parse(raw)); } catch { /* noop */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* noop */ }
  }, [items, loaded]);

  const add = (r: Research) => setItems((prev) => [r, ...prev]);
  const remove = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));

  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [
    { key: 'resumen', label: 'Resumen', icon: LayoutDashboard },
    { key: 'investigar', label: 'Investigar', icon: Search },
    { key: 'investigaciones', label: 'Investigaciones', icon: FileSearch },
    { key: 'conexiones', label: 'Fuentes web', icon: Plug, href: '/empresa', section: 'Cuenta' },
  ];

  return (
    <AgentAppShell
      agent={agent}
      nav={nav}
      activeNav={view}
      onNav={(k) => { if (k !== 'conexiones') setView(k as View); }}
      user={user}
      credits={credits}
      greeting={`Hola${firstName ? `, ${firstName}` : ''} 🔍`}
      subtitle="Inteligencia de mercado con Biznaga"
      cta={{ label: 'Nueva investigación', icon: Search, onClick: () => setView('investigar') }}
    >
      <Kpis items={items} accent={agent.color} />

      {view === 'resumen' && <Resumen items={items} accent={agent.color} onGo={setView} />}
      {view === 'investigar' && <Investigar agent={agent} onSave={add} onGoList={() => setView('investigaciones')} />}
      {view === 'investigaciones' && <Lista items={items} accent={agent.color} onRemove={remove} onGo={() => setView('investigar')} />}

      <QuickActionsBar
        accent={agent.color}
        actions={[
          { label: 'Investigar', icon: Search, onClick: () => setView('investigar') },
          { label: 'Mis investigaciones', icon: FileSearch, onClick: () => setView('investigaciones') },
          { label: 'Pásalo a Pitaya', icon: Sparkles, href: '/apps/pitaya' },
          { label: 'Activar observadores', icon: Radar, href: '/empresa' },
        ]}
      />
    </AgentAppShell>
  );
}

// ── KPIs (honestos) ────────────────────────────────────────────────────────────
function Kpis({ items, accent }: { items: Research[]; accent: string }) {
  const kinds = new Set(items.map((i) => i.kind)).size;
  const data: Kpi[] = [
    { label: 'Investigaciones', value: items.length, icon: <FileSearch className="h-4 w-4" /> },
    { label: 'Tipos cubiertos', value: kinds, icon: <Microscope className="h-4 w-4" /> },
    { label: 'Fuentes en vivo', value: '—', icon: <Radar className="h-4 w-4" />, hint: 'Requiere API de búsqueda' },
    { label: 'Alertas de mercado', value: '—', icon: <Lightbulb className="h-4 w-4" />, hint: 'Observadores (Fase F)' },
  ];
  return <KpiRow items={data} accent={accent} />;
}

// ── Resumen ────────────────────────────────────────────────────────────────────
function Resumen({ items, accent, onGo }: { items: Research[]; accent: string; onGo: (v: View) => void }) {
  const byKind = KINDS.map((k) => ({ ...k, count: items.filter((i) => i.kind === k.key).length }));
  const max = Math.max(1, ...byKind.map((k) => k.count));
  const recent = [...items].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
      <div className="space-y-5">
        {/* Observadores — honesto: requieren API de búsqueda */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Radar className="h-4 w-4" style={{ color: accent }} />
            <h3 className="font-display font-semibold">Observadores de mercado</h3>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {[
              { name: 'Radar', what: 'Noticias y regulación' },
              { name: 'Vigía', what: 'Redes y reputación' },
              { name: 'Scout', what: 'Licitaciones y leads' },
            ].map((o) => (
              <div key={o.name} className="rounded-xl border border-dashed border-border bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{o.name}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">En espera</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{o.what}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Vigilan el mercado y levantan alertas a Ramona en segundo plano. Se activan al configurar una API de búsqueda.
            <Link href="/empresa" className="ml-1 font-semibold" style={{ color: accent }}>Configurar →</Link>
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Tipos de investigación — real */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" style={{ color: accent }} />
              <h3 className="font-display font-semibold">Tipos de investigación</h3>
            </div>
            {items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Aún no has investigado.</p>
            ) : (
              <div className="space-y-2.5">
                {byKind.filter((k) => k.count > 0).map((k) => (
                  <div key={k.key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium">{k.label}</span>
                      <span className="text-muted-foreground">{k.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${(k.count / max) * 100}%`, backgroundColor: accent }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recientes — real */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <FileSearch className="h-4 w-4" style={{ color: accent }} />
              <h3 className="font-display font-semibold">Investigaciones recientes</h3>
            </div>
            {recent.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">Nada todavía.</p>
                <button onClick={() => onGo('investigar')} className="mt-2 text-xs font-medium" style={{ color: accent }}>Investigar algo →</button>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {recent.map((r) => (
                  <li key={r.id} className="min-w-0">
                    <div className="truncate text-sm font-medium">{r.topic}</div>
                    <div className="text-[11px] text-muted-foreground">{KIND[r.kind].label}{r.sector ? ` · ${r.sector}` : ''}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-2 font-display font-semibold">Cómo trabaja Biznaga</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <Step n={1} accent={accent}>Le das un tema, competidor o sector.</Step>
            <Step n={2} accent={accent}>Entrega hallazgos, oportunidades y benchmark.</Step>
            <Step n={3} accent={accent}>Pasa los insights a Peyote/Pitaya/Echinocereus.</Step>
            <Step n={4} accent={accent}>Con fuentes web, vigila y alerta sin parar.</Step>
          </ul>
        </div>
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            El análisis se basa en el conocimiento del modelo. Para datos en vivo y citas de fuentes, conecta
            una API de búsqueda (Tavily/Serper) en Conexiones.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Step({ n, accent, children }: { n: number; accent: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: accent }}>{n}</span>
      <span className="text-foreground/80">{children}</span>
    </li>
  );
}

// ── Investigar (núcleo funcional vía router de IA) ────────────────────────────
function Investigar({ agent, onSave, onGoList }: { agent: BiznagaAgent; onSave: (r: Research) => void; onGoList: () => void }) {
  const [kind, setKind] = useState<KindKey>('competencia');
  const [topic, setTopic] = useState('');
  const [sector, setSector] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [doc, setDoc] = useState<Attached | null>(null);

  async function generate() {
    const t = topic.trim();
    if (!t || loading) return;
    setLoading(true); setError(null); setResult(null);
    const prompt = withDoc(
      `Actúa como analista de inteligencia de mercado. Haz un "${KIND[kind].label}" sobre: ${t}${sector.trim() ? ` (sector: ${sector.trim()})` : ''}.\n` +
      `Entrega con encabezados claros y viñetas:\n` +
      `- Resumen ejecutivo (3-4 líneas).\n- Hallazgos clave.\n- Competidores / actores principales (si aplica).\n` +
      `- Oportunidades y amenazas.\n- Benchmark o métricas de referencia (si aplica).\n- Recomendaciones accionables.\n` +
      `Sé concreto y realista. Si algún dato requiere fuentes en vivo, indícalo explícitamente. Sin preámbulo.`,
      doc, 'Usa estos datos/fuente que te comparto',
    );
    try {
      const res = await fetch('/api/cactus/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: agent.slug, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo investigar.');
      setResult(String(data.content || '').trim());
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally { setLoading(false); }
  }

  function save() {
    if (!result) return;
    onSave({ id: uid(), kind, topic: topic.trim(), sector: sector.trim(), content: result, createdAt: Date.now() });
    onGoList();
  }
  async function copy() {
    if (!result) return;
    try { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 font-display text-lg font-semibold">Nueva investigación</h3>
        <Field label="Tipo">
          <Select value={kind} onChange={(v) => setKind(v as KindKey)} options={KINDS.map((k) => ({ value: k.key, label: k.label }))} />
        </Field>
        <Field label="Tema / competidor / marca">
          <input
            value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder="Ej. cafeterías de especialidad en Lima"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
          />
        </Field>
        <Field label="Sector / contexto (opcional)">
          <input
            value={sector} onChange={(e) => setSector(e.target.value)}
            placeholder="Ej. retail, B2B, foodtech…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
          />
        </Field>
        <div className="mb-3"><DocAttach accent={agent.color} attached={doc} onChange={setDoc} label="Adjuntar fuente o datos" /></div>
        <button
          onClick={generate}
          disabled={loading || !topic.trim()}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: agent.color }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? 'Investigando…' : 'Investigar con Biznaga'}
        </button>
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Reporte</h3>
          {result && (
            <div className="flex items-center gap-1.5">
              <button onClick={copy} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copiar
              </button>
              <button onClick={save} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: agent.color }}>
                <Check className="h-3.5 w-3.5" /> Guardar
              </button>
            </div>
          )}
        </div>
        {!result && !loading && (
          <EmptyState icon={Microscope} title="Tu reporte aparecerá aquí" text="Elige el tipo y dale un tema; Biznaga arma hallazgos, oportunidades y benchmark." accent={agent.color} />
        )}
        {loading && (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Biznaga está investigando…
          </div>
        )}
        {result && <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{result}</div>}
      </div>
    </div>
  );
}

// ── Lista de investigaciones ──────────────────────────────────────────────────
function Lista({ items, accent, onRemove, onGo }: { items: Research[]; accent: string; onRemove: (id: string) => void; onGo: () => void }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <EmptyState icon={FileSearch} title="Sin investigaciones todavía" text="Investiga un mercado o competidor y guárdalo para tener el reporte a la mano." cta={{ label: 'Investigar', onClick: onGo }} accent={accent} />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {[...items].sort((a, b) => b.createdAt - a.createdAt).map((r) => (
        <ResearchCard key={r.id} r={r} accent={accent} onRemove={() => onRemove(r.id)} />
      ))}
    </div>
  );
}

function ResearchCard({ r, accent, onRemove }: { r: Research; accent: string; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(r.content); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: accent + '14', color: accent }}>
          <Microscope className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{r.topic}</div>
          <div className="text-[11px] text-muted-foreground">{KIND[r.kind].label}{r.sector ? ` · ${r.sector}` : ''}</div>
        </div>
        <button onClick={copy} title="Copiar" className="rounded p-1.5 text-muted-foreground hover:bg-muted">
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
        <button onClick={onRemove} title="Eliminar" className="rounded p-1.5 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
        <button onClick={() => setOpen((o) => !o)} className="rounded p-1.5 text-muted-foreground hover:bg-muted">
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && <div className="mt-3 whitespace-pre-wrap border-t border-border pt-3 text-sm leading-relaxed text-foreground/90">{r.content}</div>}
    </div>
  );
}

// ── Primitivos ────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function EmptyState({
  icon: Icon, title, text, cta, accent,
}: {
  icon: typeof Search; title: string; text: string; cta?: { label: string; onClick: () => void }; accent: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: accent + '14', color: accent }}>
        <Icon className="h-6 w-6" />
      </span>
      <h4 className="font-display font-semibold">{title}</h4>
      <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
      {cta && (
        <button onClick={cta.onClick} className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white" style={{ backgroundColor: accent }}>
          <Search className="h-4 w-4" /> {cta.label}
        </button>
      )}
    </div>
  );
}
