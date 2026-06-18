'use client';

import { useEffect, useState } from 'react';
import { Markdown } from '@/components/cactus/shared/markdown';
import Link from 'next/link';
import {
  LayoutDashboard, Rocket, Megaphone, Plug, Wand2, Loader2, Copy, Check, Trash2,
  TrendingUp, Lock, BarChart3, Target, DollarSign, Percent, MousePointerClick,
  ChevronDown, FlaskConical,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { QuickActionsBar } from '@/components/cactus/app-shell/quick-actions-bar';
import { DocAttach, withDoc, type Attached } from '@/components/cactus/apps/shared/doc-attach';

interface ChollaAgent { slug: string; name: string; role: string; color: string; image: string }

// ── Dominio de pauta (master spec: Meta/Google/LinkedIn/TikTok Ads) ───────────
const PLATFORMS = [
  { key: 'meta', label: 'Meta Ads', color: '#1877F2' },
  { key: 'google', label: 'Google Ads', color: '#34A853' },
  { key: 'linkedin', label: 'LinkedIn Ads', color: '#0A66C2' },
  { key: 'tiktok', label: 'TikTok Ads', color: '#111827' },
] as const;
type PlatformKey = (typeof PLATFORMS)[number]['key'];
const PLAT = Object.fromEntries(PLATFORMS.map((p) => [p.key, p])) as Record<PlatformKey, (typeof PLATFORMS)[number]>;

const OBJECTIVES = ['Reconocimiento', 'Tráfico', 'Conversiones', 'Generación de leads', 'Ventas / Catálogo'] as const;
const PERIODS = ['al mes', 'a la semana', 'total'] as const;

interface Plan {
  id: string;
  objective: string;
  platforms: PlatformKey[];
  budget: number;
  period: string;
  audience: string;
  product: string;
  content: string;
  createdAt: number;
}

const STORAGE_KEY = 'cactus.cholla.plans.v1';
const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
const fmt = (n: number) => n.toLocaleString('es-MX');

type View = 'resumen' | 'lanzar' | 'campanas';

export function ChollaApp({
  agent, user, credits,
}: {
  agent: ChollaAgent; user?: ShellUser; credits?: number;
}) {
  const [view, setView] = useState<View>('resumen');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setPlans(JSON.parse(raw)); } catch { /* noop */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(plans)); } catch { /* noop */ }
  }, [plans, loaded]);

  const addPlan = (p: Plan) => setPlans((prev) => [p, ...prev]);
  const removePlan = (id: string) => setPlans((prev) => prev.filter((x) => x.id !== id));

  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [
    { key: 'resumen', label: 'Resumen', icon: LayoutDashboard },
    { key: 'lanzar', label: 'Lanzar campaña', icon: Rocket },
    { key: 'campanas', label: 'Campañas', icon: Megaphone },
    { key: 'conexiones', label: 'Cuentas de Ads', icon: Plug, href: '/empresa', section: 'Cuenta' },
  ];

  return (
    <AgentAppShell
      agent={agent}
      nav={nav}
      activeNav={view}
      onNav={(k) => { if (k !== 'conexiones') setView(k as View); }}
      user={user}
      credits={credits}
      greeting={`Hola${firstName ? `, ${firstName}` : ''} 🚀`}
      subtitle="Campañas y performance con Cholla"
      cta={{ label: 'Lanzar campaña', icon: Rocket, onClick: () => setView('lanzar') }}
    >
      <Kpis plans={plans} accent={agent.color} />

      {view === 'resumen' && <Resumen plans={plans} accent={agent.color} onGo={setView} />}
      {view === 'lanzar' && <Lanzar agent={agent} onSave={(p) => { addPlan(p); }} onGoList={() => setView('campanas')} />}
      {view === 'campanas' && <Campanas plans={plans} accent={agent.color} onRemove={removePlan} onGo={() => setView('lanzar')} />}

      <QuickActionsBar
        accent={agent.color}
        actions={[
          { label: 'Lanzar campaña', icon: Rocket, onClick: () => setView('lanzar') },
          { label: 'Mis campañas', icon: Megaphone, onClick: () => setView('campanas') },
          { label: 'Conectar Ads', icon: Plug, href: '/empresa' },
          { label: 'Pídele a Agave el ROI', icon: BarChart3, href: '/apps/agave' },
        ]}
      />
    </AgentAppShell>
  );
}

// ── KPIs (honestos: inversión/campañas reales · performance bloqueado) ────────
function Kpis({ plans, accent }: { plans: Plan[]; accent: string }) {
  const invest = plans.reduce((s, p) => s + (p.budget || 0), 0);
  const platforms = new Set(plans.flatMap((p) => p.platforms)).size;
  const items: Kpi[] = [
    { label: 'Campañas', value: plans.length, icon: <Megaphone className="h-4 w-4" /> },
    { label: 'Inversión planificada', value: fmt(invest), icon: <DollarSign className="h-4 w-4" /> },
    { label: 'Plataformas', value: platforms, icon: <Target className="h-4 w-4" /> },
    { label: 'ROAS', value: '—', icon: <Percent className="h-4 w-4" />, hint: 'Conecta tus cuentas de Ads' },
    { label: 'CPA', value: '—', icon: <MousePointerClick className="h-4 w-4" />, hint: 'Conecta tus cuentas de Ads' },
    { label: 'Conversiones', value: '—', icon: <TrendingUp className="h-4 w-4" />, hint: 'Conecta tus cuentas de Ads' },
  ];
  return <KpiRow items={items} accent={accent} />;
}

// ── Resumen ────────────────────────────────────────────────────────────────────
function Resumen({ plans, accent, onGo }: { plans: Plan[]; accent: string; onGo: (v: View) => void }) {
  const byPlatform = PLATFORMS.map((p) => ({ ...p, count: plans.filter((pl) => pl.platforms.includes(p.key)).length }));
  const maxCount = Math.max(1, ...byPlatform.map((p) => p.count));
  const recent = [...plans].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
      <div className="space-y-5">
        {/* Performance — bloqueado hasta conectar Ads */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" style={{ color: accent }} />
            <h3 className="font-display font-semibold">Performance de pauta</h3>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-dashed border-border bg-muted/20">
            <svg viewBox="0 0 400 120" className="h-32 w-full opacity-30" preserveAspectRatio="none" aria-hidden>
              <polyline fill="none" stroke={accent} strokeWidth="2" points="0,95 60,70 120,80 180,55 240,60 300,38 360,48 400,30" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/40 px-6 text-center backdrop-blur-[1px]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"><Lock className="h-4 w-4" /></span>
              <p className="max-w-xs text-xs text-muted-foreground">Conecta Meta, Google, LinkedIn o TikTok Ads para ver gasto, ROAS y conversiones reales.</p>
              <Link href="/empresa" className="text-xs font-semibold" style={{ color: accent }}>Conectar cuentas de Ads →</Link>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Campañas por plataforma — real */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" style={{ color: accent }} />
              <h3 className="font-display font-semibold">Campañas por plataforma</h3>
            </div>
            {plans.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Aún no has planificado campañas.</p>
            ) : (
              <div className="space-y-2.5">
                {byPlatform.filter((p) => p.count > 0).map((p) => (
                  <div key={p.key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium" style={{ color: p.color }}>{p.label}</span>
                      <span className="text-muted-foreground">{p.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${(p.count / maxCount) * 100}%`, backgroundColor: p.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Campañas recientes — real */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Megaphone className="h-4 w-4" style={{ color: accent }} />
              <h3 className="font-display font-semibold">Campañas recientes</h3>
            </div>
            {recent.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">Nada todavía.</p>
                <button onClick={() => onGo('lanzar')} className="mt-2 text-xs font-medium" style={{ color: accent }}>Lanzar mi primera campaña →</button>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {recent.map((p) => (
                  <li key={p.id} className="min-w-0">
                    <div className="truncate text-sm font-medium">{p.objective}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {p.platforms.map((k) => <span key={k} className="h-2 w-2 rounded-full" style={{ backgroundColor: PLAT[k].color }} />)}
                      <span className="ml-1 truncate">{p.product}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Plug className="h-4 w-4" style={{ color: accent }} />
            <h3 className="font-display font-semibold">Cuentas de Ads</h3>
          </div>
          <ul className="space-y-2">
            {PLATFORMS.map((p) => (
              <li key={p.key} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                <span className="inline-flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} /> {p.label}
                </span>
                <Link href="/empresa" className="text-[11px] font-medium text-muted-foreground hover:text-foreground">Conectar</Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Al conectar (Fase F), Cholla lanza y optimiza la pauta y reporta ROAS real.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-2 font-display font-semibold">Cómo trabaja Cholla</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <Step n={1} accent={accent}>Le das objetivo, presupuesto y público.</Step>
            <Step n={2} accent={accent}>Arma estructura, reparto y ángulos A/B.</Step>
            <Step n={3} accent={accent}>Pasa el copy a Pitaya y el arte a Cardón.</Step>
            <Step n={4} accent={accent}>Al conectar Ads, lanza y optimiza el ROAS.</Step>
          </ul>
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

// ── Lanzar campaña (planificador funcional vía router de IA) ──────────────────
function Lanzar({ agent, onSave, onGoList }: { agent: ChollaAgent; onSave: (p: Plan) => void; onGoList: () => void }) {
  const [objective, setObjective] = useState<string>(OBJECTIVES[2]);
  const [platforms, setPlatforms] = useState<PlatformKey[]>(['meta']);
  const [budget, setBudget] = useState('');
  const [period, setPeriod] = useState<string>(PERIODS[0]);
  const [audience, setAudience] = useState('');
  const [product, setProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [doc, setDoc] = useState<Attached | null>(null);

  const togglePlatform = (k: PlatformKey) =>
    setPlatforms((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  async function generate() {
    const b = Number(budget) || 0;
    if (!product.trim() || !platforms.length || loading) return;
    setLoading(true); setError(null); setResult(null);
    const platformLabels = platforms.map((k) => PLAT[k].label).join(', ');
    const prompt = withDoc(
      `Diseña un plan de campaña de pauta pagada accionable.\n` +
      `Objetivo: ${objective}.\nPlataformas: ${platformLabels}.\n` +
      `Presupuesto: ${b ? fmt(b) : 'por definir'} ${period}.\n` +
      `Público objetivo: ${audience.trim() || 'por definir'}.\nProducto / oferta: ${product.trim()}.\n` +
      `Incluye, con encabezados claros y viñetas:\n` +
      `- Estructura recomendada (campaña → conjuntos de anuncios) y reparto del presupuesto en % por plataforma y conjunto.\n` +
      `- Segmentación / públicos sugeridos por plataforma.\n` +
      `- 2-3 ángulos creativos para testear (A/B): qué variar y por qué.\n` +
      `- KPIs a vigilar y un ROAS/CPA objetivo realista.\n` +
      `- Próximos pasos. Sin preámbulo.`,
      doc, 'Considera este brief / datos que te comparto',
    );
    try {
      const res = await fetch('/api/cactus/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: agent.slug, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar el plan.');
      setResult(String(data.content || '').trim());
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally { setLoading(false); }
  }

  function save() {
    if (!result) return;
    onSave({
      id: uid(), objective, platforms, budget: Number(budget) || 0, period,
      audience: audience.trim(), product: product.trim(), content: result, createdAt: Date.now(),
    });
    onGoList();
  }
  async function copy() {
    if (!result) return;
    try { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      {/* Brief */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 font-display text-lg font-semibold">Nueva campaña</h3>

        <Field label="Objetivo">
          <Select value={objective} onChange={setObjective} options={OBJECTIVES as unknown as string[]} />
        </Field>

        <Field label="Plataformas">
          <div className="flex flex-wrap gap-1.5">
            {PLATFORMS.map((p) => {
              const active = platforms.includes(p.key);
              return (
                <button
                  key={p.key}
                  onClick={() => togglePlatform(p.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${active ? 'text-white' : 'border border-border text-muted-foreground hover:bg-muted'}`}
                  style={active ? { backgroundColor: p.color } : undefined}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid grid-cols-[1fr_120px] gap-3">
          <Field label="Presupuesto">
            <input
              type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)}
              placeholder="Ej. 15000"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
            />
          </Field>
          <Field label="Periodo">
            <Select value={period} onChange={setPeriod} options={PERIODS as unknown as string[]} />
          </Field>
        </div>

        <Field label="Público objetivo">
          <input
            value={audience} onChange={(e) => setAudience(e.target.value)}
            placeholder="Ej. mujeres 25-40, CDMX, interesadas en bienestar"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
          />
        </Field>

        <Field label="Producto / oferta">
          <textarea
            value={product} onChange={(e) => setProduct(e.target.value)} rows={3}
            placeholder="Qué promocionas, propuesta de valor, oferta…"
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
          />
        </Field>

        <div className="mb-3"><DocAttach accent={agent.color} attached={doc} onChange={setDoc} label="Adjuntar brief o datos" /></div>

        <button
          onClick={generate}
          disabled={loading || !product.trim() || !platforms.length}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: agent.color }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? 'Diseñando plan…' : 'Generar plan con Cholla'}
        </button>
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>

      {/* Plan */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Plan de campaña</h3>
          {result && (
            <div className="flex items-center gap-1.5">
              <button onClick={copy} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copiar
              </button>
              <button onClick={save} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: agent.color }}>
                <Check className="h-3.5 w-3.5" /> Guardar campaña
              </button>
            </div>
          )}
        </div>
        {!result && !loading && (
          <EmptyState
            icon={FlaskConical}
            title="Tu plan aparecerá aquí"
            text="Completa el brief y Cholla diseña la estructura, el reparto de presupuesto y los tests A/B."
            accent={agent.color}
          />
        )}
        {loading && (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cholla está diseñando la campaña…
          </div>
        )}
        {result && <Markdown text={result} className="text-sm leading-relaxed text-foreground/90" />}
      </div>
    </div>
  );
}

// ── Campañas (lista de planes guardados, expandible) ──────────────────────────
function Campanas({ plans, accent, onRemove, onGo }: { plans: Plan[]; accent: string; onRemove: (id: string) => void; onGo: () => void }) {
  if (plans.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <EmptyState
          icon={Rocket}
          title="Sin campañas todavía"
          text="Diseña tu primera campaña y guárdala para tener su plan a la mano."
          cta={{ label: 'Lanzar campaña', onClick: onGo }}
          accent={accent}
        />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {[...plans].sort((a, b) => b.createdAt - a.createdAt).map((p) => (
        <CampaignCard key={p.id} p={p} accent={accent} onRemove={() => onRemove(p.id)} />
      ))}
    </div>
  );
}

function CampaignCard({ p, accent, onRemove }: { p: Plan; accent: string; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(p.content); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: accent + '14', color: accent }}>
          <Megaphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{p.objective} · {p.product}</div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              {p.platforms.map((k) => <span key={k} className="h-2 w-2 rounded-full" style={{ backgroundColor: PLAT[k].color }} />)}
            </span>
            {p.budget > 0 && <span>· {fmt(p.budget)} {p.period}</span>}
          </div>
        </div>
        <button onClick={copy} title="Copiar plan" className="rounded p-1.5 text-muted-foreground hover:bg-muted">
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
        <button onClick={onRemove} title="Eliminar" className="rounded p-1.5 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
        <button onClick={() => setOpen((o) => !o)} className="rounded p-1.5 text-muted-foreground hover:bg-muted">
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && <Markdown text={p.content} className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-foreground/90" />}
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

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function EmptyState({
  icon: Icon, title, text, cta, accent,
}: {
  icon: typeof Rocket; title: string; text: string; cta?: { label: string; onClick: () => void }; accent: string;
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
          <Rocket className="h-4 w-4" /> {cta.label}
        </button>
      )}
    </div>
  );
}
