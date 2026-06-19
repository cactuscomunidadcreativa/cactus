'use client';

import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Lightbulb, Wand2, Brain, Loader2, Plus, Trash2, Check, Copy,
  ChevronDown, Filter, Target, Sparkles, TrendingUp, Heart,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { QuickActionsBar } from '@/components/cactus/app-shell/quick-actions-bar';
import { useAutomations, AutomationsPanel } from '@/components/cactus/apps/shared/automations';
import {
  PROFILES, PROFILE_ORDER, OBJECTIVES, CHANNELS,
  type ProfileKey, type ObjectiveKey, type ChannelKey,
} from '@/lib/eq/profiles';

interface PeyoteAgent { slug: string; name: string; role: string; color: string; image: string }

// ── Modelo ────────────────────────────────────────────────────────────────────
type ConceptStatus = 'idea' | 'explorando' | 'validando' | 'aprobado' | 'descartado';
const STATUS: { key: ConceptStatus; label: string; color: string }[] = [
  { key: 'idea', label: 'Idea', color: '#94a3b8' },
  { key: 'explorando', label: 'Explorando', color: '#3b82f6' },
  { key: 'validando', label: 'Validando', color: '#f59e0b' },
  { key: 'aprobado', label: 'Aprobado', color: '#22c55e' },
  { key: 'descartado', label: 'Descartado', color: '#ef4444' },
];
const ST = Object.fromEntries(STATUS.map((s) => [s.key, s])) as Record<ConceptStatus, (typeof STATUS)[number]>;

interface Variant { profile: ProfileKey; profileName: string; emoji: string; color: string; emotion: string; headline: string; body: string; cta: string; rationale: string }
interface Concept {
  id: string; title: string; brand: string; offer: string; audience: string; brief: string;
  objective: ObjectiveKey; channel: ChannelKey; status: ConceptStatus; variants: Variant[]; createdAt: number;
}

const STORAGE_KEY = 'cactus.peyote.concepts.v1';
const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

const DEFAULT_AUTOMATIONS = [
  { id: 'all-profiles', name: 'Cubrir los 8 perfiles', desc: 'Al generar, crea una variante por cada estilo emocional.', trigger: 'Al generar', enabled: true },
  { id: 'auto-status', name: 'Avanzar a "Explorando"', desc: 'Un concepto pasa de Idea a Explorando al generar variantes.', trigger: 'Variantes creadas', enabled: true },
  { id: 'emotion-tag', name: 'Etiquetar emoción dominante', desc: 'Marca la emoción objetivo en cada concepto.', trigger: 'Al guardar', enabled: false },
];

type View = 'resumen' | 'conceptos' | 'generar' | 'perfiles' | 'automatizaciones';

export function PeyoteApp({ agent, user, credits }: { agent: PeyoteAgent; user?: ShellUser; credits?: number }) {
  const [view, setView] = useState<View>('resumen');
  const [items, setItems] = useState<Concept[]>([]);
  const [loaded, setLoaded] = useState(false);
  const autos = useAutomations('peyote', DEFAULT_AUTOMATIONS);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setItems(JSON.parse(raw)); } catch { /* noop */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* noop */ }
  }, [items, loaded]);

  const add = (c: Concept) => setItems((p) => [c, ...p]);
  const remove = (id: string) => setItems((p) => p.filter((x) => x.id !== id));
  const setStatus = (id: string, status: ConceptStatus) => setItems((p) => p.map((x) => (x.id === id ? { ...x, status } : x)));

  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [
    { key: 'resumen', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'conceptos', label: 'Conceptos', icon: Lightbulb },
    { key: 'generar', label: 'Generar variantes', icon: Wand2 },
    { key: 'perfiles', label: 'Perfiles EQ', icon: Brain },
    { key: 'automatizaciones', label: 'Automatizaciones', icon: Sparkles },
  ];

  return (
    <AgentAppShell
      agent={agent}
      nav={nav}
      activeNav={view}
      onNav={(k) => setView(k as View)}
      user={user}
      credits={credits}
      greeting={`¡Hola${firstName ? `, ${firstName}` : ''}! 🌵`}
      subtitle="Convierte una idea en mensajes que hacen click emocional, perfil por perfil."
      cta={{ label: 'Nuevo concepto', icon: Plus, onClick: () => setView('generar') }}
    >
      <Kpis items={items} accent={agent.color} />

      {view === 'resumen' && <Resumen items={items} accent={agent.color} onGo={setView} />}
      {view === 'conceptos' && <Conceptos items={items} accent={agent.color} onRemove={remove} onStatus={setStatus} onGo={() => setView('generar')} />}
      {view === 'generar' && <Generar agent={agent} autos={autos} onSave={(c) => { add(c); setView('conceptos'); }} />}
      {view === 'perfiles' && <Perfiles accent={agent.color} />}
      {view === 'automatizaciones' && <AutomationsPanel autos={autos} accent={agent.color} title="Automatizaciones de Peyote" />}

      <QuickActionsBar
        accent={agent.color}
        actions={[
          { label: 'Generar variantes', icon: Wand2, onClick: () => setView('generar') },
          { label: 'Mis conceptos', icon: Lightbulb, onClick: () => setView('conceptos') },
          { label: 'Pásalo a Pitaya', icon: Sparkles, href: '/apps/pitaya' },
          { label: 'Perfiles EQ', icon: Brain, onClick: () => setView('perfiles') },
        ]}
      />
    </AgentAppShell>
  );
}

// ── KPIs honestos ─────────────────────────────────────────────────────────────
function Kpis({ items, accent }: { items: Concept[]; accent: string }) {
  const aprob = items.filter((c) => c.status === 'aprobado').length;
  const variantes = items.reduce((n, c) => n + c.variants.length, 0);
  const enJuego = items.filter((c) => c.status !== 'descartado').length;
  const tasa = items.length ? Math.round((aprob / items.length) * 100) : 0;
  const data: Kpi[] = [
    { label: 'Conceptos', value: items.length, icon: <Lightbulb className="h-4 w-4" /> },
    { label: 'Variantes', value: variantes, icon: <Wand2 className="h-4 w-4" /> },
    { label: 'En juego', value: enJuego, icon: <Target className="h-4 w-4" /> },
    { label: 'Aprobados', value: aprob, icon: <Check className="h-4 w-4" /> },
    { label: 'Tasa aprobación', value: `${tasa}%`, icon: <TrendingUp className="h-4 w-4" /> },
    { label: 'Perfiles EQ', value: 8, icon: <Brain className="h-4 w-4" />, hint: 'Modelo Six Seconds' },
  ];
  return <KpiRow items={data} accent={accent} />;
}

// ── Resumen ─────────────────────────────────────────────────────────────────
function Resumen({ items, accent, onGo }: { items: Concept[]; accent: string; onGo: (v: View) => void }) {
  const byStatus = STATUS.map((s) => ({ ...s, n: items.filter((c) => c.status === s.key).length }));
  const max = Math.max(1, ...byStatus.map((s) => s.n));
  const recent = [...items].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8">
        <EmptyState icon={Lightbulb} title="Aún no hay conceptos" text="Dale a Peyote una idea y un objetivo emocional; te devuelve una variante por cada estilo cerebral." accent={accent} cta={{ label: 'Crear concepto', onClick: () => onGo('generar') }} />
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        {/* Embudo por estado */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2"><Filter className="h-4 w-4" style={{ color: accent }} /><h3 className="font-display font-semibold">Embudo de conceptos</h3></div>
          <div className="space-y-2.5">
            {byStatus.map((s) => (
              <div key={s.key}>
                <div className="mb-1 flex items-center justify-between text-xs"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />{s.label}</span><span className="text-muted-foreground">{s.n}</span></div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(s.n / max) * 100}%`, backgroundColor: s.color }} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* Ideas recientes */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-display font-semibold">Conceptos recientes</h3><button onClick={() => onGo('conceptos')} className="text-xs font-medium" style={{ color: accent }}>Ver todos →</button></div>
          <ul className="space-y-2.5">
            {recent.map((c) => (
              <li key={c.id} className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: accent + '14', color: accent }}><Lightbulb className="h-3.5 w-3.5" /></span>
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{c.title}</div><div className="text-[11px] text-muted-foreground">{c.brand} · {c.variants.length} variantes</div></div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: ST[c.status].color }}>{ST[c.status].label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-2 font-display font-semibold">Cómo trabaja Peyote</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <Step n={1} accent={accent}>Le das una idea, audiencia y objetivo emocional.</Step>
            <Step n={2} accent={accent}>Escribe una variante por cada estilo cerebral.</Step>
            <Step n={3} accent={accent}>Eliges la que conecta y la avanzas en el embudo.</Step>
            <Step n={4} accent={accent}>La pasas a Pitaya o Nopal para producir.</Step>
          </ul>
        </div>
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5">
          <div className="mb-2 flex items-center gap-2"><Heart className="h-4 w-4" style={{ color: accent }} /><span className="text-sm font-semibold">Motor emocional</span></div>
          <p className="text-xs leading-relaxed text-muted-foreground">Cada persona decide distinto según su estilo cerebral. El mismo mensaje, varios gatillos, para que cada público haga click.</p>
        </div>
      </aside>
    </div>
  );
}

function Step({ n, accent, children }: { n: number; accent: string; children: React.ReactNode }) {
  return <li className="flex items-start gap-2.5"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: accent }}>{n}</span><span className="text-foreground/80">{children}</span></li>;
}

// ── Generar variantes (motor EQ) ──────────────────────────────────────────────
function Generar({ agent, autos, onSave }: { agent: PeyoteAgent; autos: ReturnType<typeof useAutomations>; onSave: (c: Concept) => void }) {
  const [brand, setBrand] = useState('');
  const [offer, setOffer] = useState('');
  const [audience, setAudience] = useState('');
  const [brief, setBrief] = useState('');
  const [objective, setObjective] = useState<ObjectiveKey>('deseo');
  const [channel, setChannel] = useState<ChannelKey>('instagram');
  const [sel, setSel] = useState<ProfileKey[]>([...PROFILE_ORDER]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);

  const profiles = autos.isOn('all-profiles') ? PROFILE_ORDER : sel;

  function toggleProfile(k: ProfileKey) {
    setSel((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  }

  async function generate() {
    if (!brand.trim() || !offer.trim() || !brief.trim() || loading) return;
    setLoading(true); setError(null); setVariants([]);
    try {
      const res = await fetch('/api/cactus/eq/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: { brandName: brand.trim(), offer: offer.trim(), audience: audience.trim(), brief: brief.trim() },
          objective, channel, profiles,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar.');
      setVariants(data.variants || []);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally { setLoading(false); }
  }

  function save() {
    if (!variants.length) return;
    onSave({
      id: uid(), title: brief.trim().slice(0, 60) || brand.trim(), brand: brand.trim(), offer: offer.trim(),
      audience: audience.trim(), brief: brief.trim(), objective, channel,
      status: autos.isOn('auto-status') ? 'explorando' : 'idea', variants, createdAt: Date.now(),
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 font-display text-lg font-semibold">Brief del concepto</h3>
        <Field label="Marca"><input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ej. Cactus" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></Field>
        <Field label="Qué ofrece"><input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="Ej. plataforma de agentes IA" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></Field>
        <Field label="Audiencia"><input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Ej. dueños de pymes" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></Field>
        <Field label="Idea / mensaje a comunicar"><textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={2} placeholder="Ej. tu equipo se multiplica con agentes" className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Objetivo"><Select value={objective} onChange={(v) => setObjective(v as ObjectiveKey)} options={OBJECTIVES.map((o) => ({ value: o.key, label: o.label }))} /></Field>
          <Field label="Canal"><Select value={channel} onChange={(v) => setChannel(v as ChannelKey)} options={CHANNELS.map((c) => ({ value: c.key, label: c.label }))} /></Field>
        </div>
        {!autos.isOn('all-profiles') && (
          <Field label={`Perfiles (${sel.length})`}>
            <div className="flex flex-wrap gap-1.5">
              {PROFILE_ORDER.map((k) => {
                const on = sel.includes(k);
                return <button key={k} onClick={() => toggleProfile(k)} className="rounded-full border px-2.5 py-1 text-xs transition-colors" style={on ? { backgroundColor: PROFILES[k].color, color: '#fff', borderColor: PROFILES[k].color } : { borderColor: 'var(--border)' }}>{PROFILES[k].emoji} {PROFILES[k].name}</button>;
              })}
            </div>
          </Field>
        )}
        <button onClick={generate} disabled={loading || !brand.trim() || !offer.trim() || !brief.trim()} className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: agent.color }}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}{loading ? 'Escribiendo…' : 'Generar variantes EQ'}
        </button>
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Variantes por perfil</h3>
          {variants.length > 0 && <button onClick={save} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: agent.color }}><Check className="h-3.5 w-3.5" /> Guardar concepto</button>}
        </div>
        {!variants.length && !loading && <div className="rounded-2xl border border-border bg-card p-5"><EmptyState icon={Sparkles} title="Tus variantes aparecerán aquí" text="Completa el brief y Peyote escribe un mensaje por cada estilo cerebral." accent={agent.color} /></div>}
        {loading && <div className="flex h-48 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Escribiendo una variante por perfil…</div>}
        <div className="grid gap-3 sm:grid-cols-2">
          {variants.map((v) => <VariantCard key={v.profile} v={v} />)}
        </div>
      </div>
    </div>
  );
}

function VariantCard({ v }: { v: Variant }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(`${v.headline}\n\n${v.body}\n\n${v.cta}`); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-4" style={{ borderTopColor: v.color, borderTopWidth: 3 }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold">{v.emoji} {v.profileName}</span>
        <button onClick={copy} className="rounded p-1 text-muted-foreground hover:bg-muted">{copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}</button>
      </div>
      <span className="mb-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: v.color }}>{v.emotion}</span>
      <p className="text-sm font-semibold leading-snug">{v.headline}</p>
      <p className="mt-1 text-xs leading-relaxed text-foreground/80">{v.body}</p>
      <p className="mt-2 text-xs font-medium" style={{ color: v.color }}>{v.cta}</p>
      {v.rationale && <p className="mt-2 border-t border-border pt-2 text-[11px] italic text-muted-foreground">{v.rationale}</p>}
    </div>
  );
}

// ── Conceptos ─────────────────────────────────────────────────────────────────
function Conceptos({ items, accent, onRemove, onStatus, onGo }: { items: Concept[]; accent: string; onRemove: (id: string) => void; onStatus: (id: string, s: ConceptStatus) => void; onGo: () => void }) {
  if (items.length === 0) return <div className="rounded-2xl border border-border bg-card p-5"><EmptyState icon={Lightbulb} title="Sin conceptos" text="Genera tu primer concepto con variantes emocionales." accent={accent} cta={{ label: 'Crear concepto', onClick: onGo }} /></div>;
  return <div className="space-y-3">{[...items].sort((a, b) => b.createdAt - a.createdAt).map((c) => <ConceptCard key={c.id} c={c} accent={accent} onRemove={() => onRemove(c.id)} onStatus={(s) => onStatus(c.id, s)} />)}</div>;
}

function ConceptCard({ c, accent, onRemove, onStatus }: { c: Concept; accent: string; onRemove: () => void; onStatus: (s: ConceptStatus) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: accent + '14', color: accent }}><Lightbulb className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{c.title}</div><div className="text-[11px] text-muted-foreground">{c.brand} · {c.variants.length} variantes</div></div>
        <select value={c.status} onChange={(e) => onStatus(e.target.value as ConceptStatus)} className="rounded-lg border border-border bg-background px-2 py-1 text-xs">
          {STATUS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <button onClick={onRemove} title="Eliminar" className="rounded p-1.5 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
        <button onClick={() => setOpen((o) => !o)} className="rounded p-1.5 text-muted-foreground hover:bg-muted"><ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} /></button>
      </div>
      {open && <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">{c.variants.map((v) => <VariantCard key={v.profile} v={v} />)}</div>}
    </div>
  );
}

// ── Perfiles EQ (referencia) ──────────────────────────────────────────────────
function Perfiles({ accent }: { accent: string }) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="font-display text-lg font-semibold">Los 8 estilos cerebrales</h3>
        <p className="text-sm text-muted-foreground">Cada uno decide distinto. Peyote escribe el ángulo correcto para cada uno.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PROFILE_ORDER.map((k) => {
          const p = PROFILES[k];
          return (
            <div key={k} className="rounded-2xl border border-border bg-card p-4" style={{ borderTopColor: p.color, borderTopWidth: 3 }}>
              <div className="mb-1 text-2xl">{p.emoji}</div>
              <div className="font-display font-semibold">{p.name}</div>
              <p className="mt-1 text-[11px] text-muted-foreground">{p.decides}</p>
              <p className="mt-2 text-xs"><span className="font-semibold" style={{ color: p.color }}>Ángulo:</span> {p.angle}</p>
              <p className="mt-1 text-[11px] text-muted-foreground"><span className="font-semibold">Evita:</span> {p.avoid}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Primitivos ────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-3"><label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>{children}</div>;
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none">{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}
function EmptyState({ icon: Icon, title, text, cta, accent }: { icon: typeof Lightbulb; title: string; text: string; cta?: { label: string; onClick: () => void }; accent: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: accent + '14', color: accent }}><Icon className="h-6 w-6" /></span>
      <h4 className="font-display font-semibold">{title}</h4>
      <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
      {cta && <button onClick={cta.onClick} className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white" style={{ backgroundColor: accent }}><Plus className="h-4 w-4" /> {cta.label}</button>}
    </div>
  );
}
