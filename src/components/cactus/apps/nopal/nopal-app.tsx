'use client';

import { useEffect, useMemo, useState } from 'react';
import { Markdown } from '@/components/cactus/shared/markdown';
import {
  LayoutDashboard, Sparkles, CalendarDays, Library, Plug, PenLine,
  Copy, Check, Trash2, Loader2, Wand2, FileText, Send, CalendarPlus,
  Users, Heart, TrendingUp, Lock, BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { QuickActionsBar } from '@/components/cactus/app-shell/quick-actions-bar';

// ── Identidad del agente (recibida del catálogo, server-side) ────────────────
interface NopalAgent { slug: string; name: string; role: string; color: string; image: string }

// ── Constantes del dominio social ────────────────────────────────────────────
const NETWORKS = [
  { key: 'instagram', label: 'Instagram', color: '#E1306C' },
  { key: 'tiktok', label: 'TikTok', color: '#111827' },
  { key: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
  { key: 'facebook', label: 'Facebook', color: '#1877F2' },
  { key: 'x', label: 'X', color: '#0F172A' },
] as const;
type NetworkKey = (typeof NETWORKS)[number]['key'];
const NET = Object.fromEntries(NETWORKS.map((n) => [n.key, n])) as Record<NetworkKey, (typeof NETWORKS)[number]>;

const FORMATS = ['Post de feed', 'Carrusel', 'Reel / video corto', 'Historia', 'Hilo'] as const;
const TONES = ['Cercano', 'Profesional', 'Divertido', 'Inspirador', 'Vendedor'] as const;
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface Draft {
  id: string;
  network: NetworkKey;
  format: string;
  tone: string;
  topic: string;
  content: string;
  day: number | null; // 0=Lun … 6=Dom · null = sin programar
  createdAt: number;
}

const STORAGE_KEY = 'cactus.nopal.drafts.v1';
const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

type View = 'resumen' | 'generador' | 'calendario' | 'biblioteca';

export function NopalApp({
  agent, user, credits,
}: {
  agent: NopalAgent; user?: ShellUser; credits?: number;
}) {
  const [view, setView] = useState<View>('resumen');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Persistencia local (honesto: borradores en este navegador hasta que existan conexiones reales)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDrafts(JSON.parse(raw));
    } catch { /* noop */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts)); } catch { /* noop */ }
  }, [drafts, loaded]);

  const addDrafts = (items: Draft[]) => setDrafts((d) => [...items, ...d]);
  const removeDraft = (id: string) => setDrafts((d) => d.filter((x) => x.id !== id));
  const scheduleDraft = (id: string, day: number | null) =>
    setDrafts((d) => d.map((x) => (x.id === id ? { ...x, day } : x)));

  const nav: AppNavItem[] = [
    { key: 'resumen', label: 'Resumen', icon: LayoutDashboard },
    { key: 'generador', label: 'Generador de posts', icon: Sparkles },
    { key: 'calendario', label: 'Calendario', icon: CalendarDays },
    { key: 'biblioteca', label: 'Biblioteca', icon: Library },
    { key: 'conexiones', label: 'Conexiones', icon: Plug, href: '/empresa', section: 'Cuenta' },
  ];

  const firstName = user?.name?.split(' ')[0];

  return (
    <AgentAppShell
      agent={agent}
      nav={nav}
      activeNav={view}
      onNav={(k) => { if (k !== 'conexiones') setView(k as View); }}
      user={user}
      credits={credits}
      greeting={`Hola${firstName ? `, ${firstName}` : ''} 👋`}
      subtitle="Tu estudio de redes sociales con Nopal"
      cta={{ label: 'Nuevo post', icon: PenLine, onClick: () => setView('generador') }}
    >
      <Kpis drafts={drafts} accent={agent.color} />

      {view === 'resumen' && (
        <Resumen drafts={drafts} accent={agent.color} onGo={setView} onSchedule={scheduleDraft} onRemove={removeDraft} />
      )}
      {view === 'generador' && (
        <Generador agent={agent} onSave={addDrafts} onGoCalendar={() => setView('calendario')} />
      )}
      {view === 'calendario' && (
        <Calendario drafts={drafts} accent={agent.color} onSchedule={scheduleDraft} onRemove={removeDraft} />
      )}
      {view === 'biblioteca' && (
        <Biblioteca drafts={drafts} accent={agent.color} onSchedule={scheduleDraft} onRemove={removeDraft} onGo={() => setView('generador')} />
      )}

      <QuickActionsBar
        accent={agent.color}
        actions={[
          { label: 'Generar post', icon: Wand2, onClick: () => setView('generador') },
          { label: 'Ver calendario', icon: CalendarDays, onClick: () => setView('calendario') },
          { label: 'Biblioteca', icon: Library, onClick: () => setView('biblioteca') },
          { label: 'Conectar redes', icon: Plug, href: '/empresa' },
        ]}
      />
    </AgentAppShell>
  );
}

// ── KPIs (vista 16: 6 tarjetas; honestas — lo real va con número, la analítica
//    que depende de conexiones va con "—" hasta Fase F) ──────────────────────
function Kpis({ drafts, accent }: { drafts: Draft[]; accent: string }) {
  const scheduled = drafts.filter((d) => d.day != null).length;
  const networks = new Set(drafts.map((d) => d.network)).size;
  const items: Kpi[] = [
    { label: 'Borradores', value: drafts.length, icon: <FileText className="h-4 w-4" />, hint: 'en este navegador' },
    { label: 'Programados', value: scheduled, icon: <CalendarDays className="h-4 w-4" /> },
    { label: 'Redes en uso', value: networks, icon: <Sparkles className="h-4 w-4" /> },
    { label: 'Seguidores', value: '—', icon: <Users className="h-4 w-4" />, hint: 'Al conectar tus redes' },
    { label: 'Alcance', value: '—', icon: <TrendingUp className="h-4 w-4" />, hint: 'Al conectar tus redes' },
    { label: 'Engagement', value: '—', icon: <Heart className="h-4 w-4" />, hint: 'Al conectar tus redes' },
  ];
  return <KpiRow items={items} accent={accent} />;
}

// ── Resumen (dashboard fiel a la vista 16, con honestidad de datos) ───────────
function Resumen({
  drafts, accent, onGo, onSchedule, onRemove,
}: {
  drafts: Draft[]; accent: string; onGo: (v: View) => void;
  onSchedule: (id: string, day: number | null) => void; onRemove: (id: string) => void;
}) {
  const upcoming = [...drafts].filter((d) => d.day != null).sort((a, b) => (a.day! - b.day!));
  const byNetwork = NETWORKS.map((n) => ({ ...n, count: drafts.filter((d) => d.network === n.key).length }));
  const maxCount = Math.max(1, ...byNetwork.map((n) => n.count));

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
      {/* Columna principal */}
      <div className="space-y-5">
        {/* Rendimiento — bloqueado hasta conectar (vista 16, sin números inventados) */}
        <LockedPanel
          icon={TrendingUp}
          title="Rendimiento"
          accent={accent}
          message="Conecta tus redes para ver tu alcance, engagement e impresiones reales a lo largo del tiempo."
        />

        <div className="grid gap-5 md:grid-cols-2">
          {/* Contenido por red — datos reales de tus borradores */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" style={{ color: accent }} />
              <h3 className="font-display font-semibold">Tu contenido por red</h3>
            </div>
            {drafts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Aún no has generado contenido.</p>
            ) : (
              <div className="space-y-2.5">
                {byNetwork.filter((n) => n.count > 0).map((n) => (
                  <div key={n.key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium" style={{ color: n.color }}>{n.label}</span>
                      <span className="text-muted-foreground">{n.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${(n.count / maxCount) * 100}%`, backgroundColor: n.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Próximas publicaciones — datos reales (programadas) */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4" style={{ color: accent }} />
              <h3 className="font-display font-semibold">Próximas publicaciones</h3>
            </div>
            {upcoming.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">Nada programado.</p>
                <button onClick={() => onGo('calendario')} className="mt-2 text-xs font-medium" style={{ color: accent }}>Ir al calendario →</button>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {upcoming.slice(0, 5).map((d) => (
                  <li key={d.id} className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg text-[10px] font-semibold" style={{ backgroundColor: NET[d.network].color + '14', color: NET[d.network].color }}>
                      {DAYS[d.day!]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-medium" style={{ color: NET[d.network].color }}>{NET[d.network].label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{d.content.split('\n')[0]}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Posts recientes */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-1 font-display text-lg font-semibold">Contenido reciente</h3>
          {drafts.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Aún no hay posts"
              text="Dile un tema a Nopal y generará captions listos para publicar, con CTA y hashtags."
              cta={{ label: 'Generar mi primer post', onClick: () => onGo('generador') }}
              accent={accent}
            />
          ) : (
            <div className="mt-3 space-y-3">
              {[...drafts].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3).map((d) => (
                <DraftCard key={d.id} d={d} accent={accent} onSchedule={onSchedule} onRemove={onRemove} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Columna lateral */}
      <aside className="space-y-5">
        {/* Cuentas conectadas (vista 16) — honesto: ninguna conectada todavía */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Plug className="h-4 w-4" style={{ color: accent }} />
            <h3 className="font-display font-semibold">Cuentas conectadas</h3>
          </div>
          <ul className="space-y-2">
            {NETWORKS.map((n) => (
              <li key={n.key} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                <span className="inline-flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: n.color }} /> {n.label}
                </span>
                <Link href="/empresa" className="text-[11px] font-medium text-muted-foreground hover:text-foreground">Conectar</Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Al conectar (Fase F) se desbloquean publicación automática y métricas reales.
          </p>
        </div>

        {/* Cómo trabaja Nopal */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-2 font-display font-semibold">Cómo trabaja Nopal</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <Step n={1} accent={accent}>Le das un tema y la red.</Step>
            <Step n={2} accent={accent}>Genera variantes con CTA y hashtags.</Step>
            <Step n={3} accent={accent}>Las guardas y programas en el calendario.</Step>
            <Step n={4} accent={accent}>Al conectar tus redes, publica por ti.</Step>
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

// Panel de analítica bloqueado hasta conectar (honesto: nunca números falsos)
function LockedPanel({ icon: Icon, title, message, accent }: { icon: typeof TrendingUp; title: string; message: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: accent }} />
        <h3 className="font-display font-semibold">{title}</h3>
      </div>
      <div className="relative overflow-hidden rounded-xl border border-dashed border-border bg-muted/20">
        {/* Línea base decorativa, claramente vacía (sin datos) */}
        <svg viewBox="0 0 400 120" className="h-32 w-full opacity-30" preserveAspectRatio="none" aria-hidden>
          <polyline fill="none" stroke={accent} strokeWidth="2" points="0,90 60,80 120,95 180,60 240,75 300,45 360,65 400,40" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/40 px-6 text-center backdrop-blur-[1px]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"><Lock className="h-4 w-4" /></span>
          <p className="max-w-xs text-xs text-muted-foreground">{message}</p>
          <Link href="/empresa" className="text-xs font-semibold" style={{ color: accent }}>Conectar redes →</Link>
        </div>
      </div>
    </div>
  );
}

// ── Generador (núcleo funcional: usa el router de IA real) ────────────────────
function Generador({
  agent, onSave, onGoCalendar,
}: {
  agent: NopalAgent; onSave: (d: Draft[]) => void; onGoCalendar: () => void;
}) {
  const [network, setNetwork] = useState<NetworkKey>('instagram');
  const [format, setFormat] = useState<string>(FORMATS[0]);
  const [tone, setTone] = useState<string>(TONES[0]);
  const [count, setCount] = useState(2);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ id: string; content: string }[]>([]);

  async function generate() {
    const t = topic.trim();
    if (!t || loading) return;
    setLoading(true); setError(null); setResults([]);
    const prompt =
      `Crea ${count} variante(s) de "${format}" para ${NET[network].label} con tono ${tone}.\n` +
      `Tema / objetivo: ${t}.\n` +
      `Cada variante debe incluir: el copy listo para publicar, una llamada a la acción y de 5 a 8 hashtags relevantes.\n` +
      `Separa cada variante con una línea exacta "—— Variante N ——" (N = número). No agregues introducción ni cierre.`;
    try {
      const res = await fetch('/api/cactus/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: agent.slug, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar.');
      const parts = String(data.content || '')
        .split(/\n?\s*—{0,3}\s*variante\s*\d+\s*—{0,3}\s*\n?/i)
        .map((s) => s.trim())
        .filter(Boolean);
      const list = (parts.length ? parts : [String(data.content || '').trim()]).filter(Boolean);
      setResults(list.map((content) => ({ id: uid(), content })));
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  function saveOne(content: string) {
    onSave([{ id: uid(), network, format, tone, topic: topic.trim(), content, day: null, createdAt: Date.now() }]);
    setResults((r) => r.filter((x) => x.content !== content));
  }
  function saveAll() {
    if (!results.length) return;
    onSave(results.map((r) => ({
      id: uid(), network, format, tone, topic: topic.trim(), content: r.content, day: null, createdAt: Date.now(),
    })));
    setResults([]);
    onGoCalendar();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      {/* Brief */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 font-display text-lg font-semibold">Generar contenido</h3>

        <Field label="Red social">
          <div className="flex flex-wrap gap-1.5">
            {NETWORKS.map((n) => {
              const active = n.key === network;
              return (
                <button
                  key={n.key}
                  onClick={() => setNetwork(n.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${active ? 'text-white' : 'border border-border text-muted-foreground hover:bg-muted'}`}
                  style={active ? { backgroundColor: n.color } : undefined}
                >
                  {n.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Formato">
          <Select value={format} onChange={setFormat} options={FORMATS as unknown as string[]} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Tono">
            <Select value={tone} onChange={setTone} options={TONES as unknown as string[]} />
          </Field>
          <Field label="Variantes">
            <Select value={String(count)} onChange={(v) => setCount(Number(v))} options={['1', '2', '3']} />
          </Field>
        </div>

        <Field label="Tema / objetivo">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={3}
            placeholder="Ej. Lanzamiento de nuestra nueva línea de café de especialidad…"
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1"
            style={{ ['--tw-ring-color' as string]: agent.color }}
          />
        </Field>

        <button
          onClick={generate}
          disabled={loading || !topic.trim()}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: agent.color }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? 'Generando…' : 'Generar con Nopal'}
        </button>
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>

      {/* Resultados */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Variantes</h3>
          {results.length > 0 && (
            <button onClick={saveAll} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted">
              <CalendarPlus className="h-3.5 w-3.5" /> Guardar todas y programar
            </button>
          )}
        </div>

        {results.length === 0 && !loading && (
          <EmptyState
            icon={Send}
            title="Tus variantes aparecerán aquí"
            text="Completa el brief de la izquierda y Nopal generará el copy listo para cada red."
            accent={agent.color}
          />
        )}
        {loading && (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Nopal está escribiendo…
          </div>
        )}
        <div className="space-y-3">
          {results.map((r) => (
            <ResultCard key={r.id} content={r.content} network={network} accent={agent.color} onSave={() => saveOne(r.content)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultCard({
  content, network, accent, onSave,
}: {
  content: string; network: NetworkKey; accent: string; onSave: () => void;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
  }
  return (
    <div className="rounded-xl border border-border bg-background p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <NetBadge network={network} />
        <div className="flex items-center gap-1">
          <button onClick={copy} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copiado' : 'Copiar'}
          </button>
          <button onClick={onSave} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-white" style={{ backgroundColor: accent }}>
            <CalendarPlus className="h-3.5 w-3.5" /> Guardar
          </button>
        </div>
      </div>
      <Markdown text={content} className="text-sm leading-relaxed text-foreground/90" />
    </div>
  );
}

// ── Calendario (planeación; publicación real = Fase F) ────────────────────────
function Calendario({
  drafts, accent, onSchedule, onRemove,
}: {
  drafts: Draft[]; accent: string; onSchedule: (id: string, day: number | null) => void; onRemove: (id: string) => void;
}) {
  const unscheduled = drafts.filter((d) => d.day == null);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
        Calendario de planeación semanal. La publicación automática se activa al conectar tus redes.
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {DAYS.map((day, i) => {
          const posts = drafts.filter((d) => d.day === i);
          return (
            <div key={day} className="min-h-[140px] rounded-xl border border-border bg-card p-2.5">
              <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">{day}</div>
              <div className="space-y-2">
                {posts.map((d) => (
                  <MiniCard key={d.id} d={d} onUnschedule={() => onSchedule(d.id, null)} onRemove={() => onRemove(d.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-display font-semibold">Sin programar <span className="text-sm font-normal text-muted-foreground">({unscheduled.length})</span></h3>
        {unscheduled.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todo tu contenido está programado. 🌵</p>
        ) : (
          <div className="space-y-3">
            {unscheduled.map((d) => (
              <DraftCard key={d.id} d={d} accent={accent} onSchedule={onSchedule} onRemove={onRemove} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniCard({ d, onUnschedule, onRemove }: { d: Draft; onUnschedule: () => void; onRemove: () => void }) {
  return (
    <div className="group rounded-lg border-l-2 bg-background p-2" style={{ borderLeftColor: NET[d.network].color }}>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-semibold" style={{ color: NET[d.network].color }}>{NET[d.network].label}</span>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={onUnschedule} title="Quitar del día" className="text-muted-foreground hover:text-foreground"><CalendarDays className="h-3 w-3" /></button>
          <button onClick={onRemove} title="Eliminar" className="text-muted-foreground hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
        </div>
      </div>
      <p className="line-clamp-3 text-[11px] leading-snug text-foreground/80">{d.content}</p>
    </div>
  );
}

// ── Biblioteca ────────────────────────────────────────────────────────────────
function Biblioteca({
  drafts, accent, onSchedule, onRemove, onGo,
}: {
  drafts: Draft[]; accent: string; onSchedule: (id: string, day: number | null) => void; onRemove: (id: string) => void; onGo: () => void;
}) {
  if (drafts.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <EmptyState
          icon={Library}
          title="Tu biblioteca está vacía"
          text="Los posts que generes y guardes aparecerán aquí, listos para copiar o programar."
          cta={{ label: 'Generar contenido', onClick: onGo }}
          accent={accent}
        />
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {[...drafts].sort((a, b) => b.createdAt - a.createdAt).map((d) => (
        <DraftCard key={d.id} d={d} accent={accent} onSchedule={onSchedule} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ── Tarjeta de borrador reutilizable ──────────────────────────────────────────
function DraftCard({
  d, accent, onSchedule, onRemove,
}: {
  d: Draft; accent: string; onSchedule: (id: string, day: number | null) => void; onRemove: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(d.content); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
  }
  return (
    <div className="flex flex-col rounded-xl border border-border bg-background p-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <NetBadge network={d.network} />
        <span className="truncate text-[11px] text-muted-foreground">{d.format}</span>
      </div>
      <p className="mb-3 line-clamp-5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{d.content}</p>
      <div className="mt-auto flex items-center gap-1.5 border-t border-border pt-2.5">
        <select
          value={d.day ?? ''}
          onChange={(e) => onSchedule(d.id, e.target.value === '' ? null : Number(e.target.value))}
          className="rounded-md border border-border bg-card px-2 py-1 text-[11px] focus:outline-none"
          title="Programar día"
        >
          <option value="">Sin día</option>
          {DAYS.map((day, i) => <option key={day} value={i}>{day}</option>)}
        </select>
        <button onClick={copy} className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <button onClick={() => onRemove(d.id)} className="inline-flex items-center rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:text-red-500">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Primitivos ────────────────────────────────────────────────────────────────
function NetBadge({ network }: { network: NetworkKey }) {
  const n = NET[network];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: n.color }}>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: n.color }} /> {n.label}
    </span>
  );
}

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
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function EmptyState({
  icon: Icon, title, text, cta, accent,
}: {
  icon: typeof Sparkles; title: string; text: string; cta?: { label: string; onClick: () => void }; accent: string;
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
          <Sparkles className="h-4 w-4" /> {cta.label}
        </button>
      )}
    </div>
  );
}
