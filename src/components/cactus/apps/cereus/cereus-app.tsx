'use client';

import { useEffect, useState } from 'react';
import { Markdown } from '@/components/cactus/shared/markdown';
import {
  LayoutDashboard, Shirt, Wand2, Loader2, Plus, Trash2, Check, Copy, ChevronDown,
  Sparkles, Palette, Tag, Layers, Image as ImageIcon,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { QuickActionsBar } from '@/components/cactus/app-shell/quick-actions-bar';
import { useAutomations, AutomationsPanel } from '@/components/cactus/apps/shared/automations';

interface CereusAgent { slug: string; name: string; role: string; color: string; image: string }

const KINDS = [
  { key: 'producto', label: 'Descripción de producto', hint: 'Ficha de venta lista para e-commerce' },
  { key: 'coleccion', label: 'Concepto de colección', hint: 'Nombre, moodboard y narrativa' },
  { key: 'campana', label: 'Copy de campaña', hint: 'Mensaje de lanzamiento por canal' },
  { key: 'ficha', label: 'Ficha técnica', hint: 'Materiales, cuidados y composición' },
] as const;
type KindKey = (typeof KINDS)[number]['key'];
const KIND = Object.fromEntries(KINDS.map((k) => [k.key, k])) as Record<KindKey, (typeof KINDS)[number]>;

interface Piece { id: string; kind: KindKey; title: string; context: string; content: string; createdAt: number }

const STORAGE_KEY = 'cactus.cereus.pieces.v1';
const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

const DEFAULT_AUTOMATIONS = [
  { id: 'seo-tags', name: 'Sugerir etiquetas SEO', desc: 'Añade palabras clave de búsqueda a las descripciones.', trigger: 'Al generar producto', enabled: true },
  { id: 'multichannel', name: 'Adaptar a canales', desc: 'Propone versión corta para redes y larga para tienda.', trigger: 'Al generar copy', enabled: false },
  { id: 'sizing-note', name: 'Nota de talla y cuidado', desc: 'Incluye guía de tallas y cuidado en cada ficha.', trigger: 'Al generar ficha', enabled: true },
];

type View = 'resumen' | 'crear' | 'galeria' | 'automatizaciones';

export function CereusApp({ agent, user, credits }: { agent: CereusAgent; user?: ShellUser; credits?: number }) {
  const [view, setView] = useState<View>('resumen');
  const [items, setItems] = useState<Piece[]>([]);
  const [loaded, setLoaded] = useState(false);
  const autos = useAutomations('cereus', DEFAULT_AUTOMATIONS);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setItems(JSON.parse(raw)); } catch { /* noop */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* noop */ }
  }, [items, loaded]);

  const add = (p: Piece) => setItems((prev) => [p, ...prev]);
  const remove = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));

  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [
    { key: 'resumen', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'crear', label: 'Crear', icon: Wand2 },
    { key: 'galeria', label: 'Galería', icon: Layers },
    { key: 'automatizaciones', label: 'Automatizaciones', icon: Sparkles },
  ];

  return (
    <AgentAppShell
      agent={agent} nav={nav} activeNav={view} onNav={(k) => setView(k as View)}
      user={user} credits={credits}
      greeting={`¡Hola${firstName ? `, ${firstName}` : ''}! 🌵`}
      subtitle="Estudio de moda y producto: concepto, copy y ficha en minutos."
      cta={{ label: 'Crear pieza', icon: Plus, onClick: () => setView('crear') }}
    >
      <Kpis items={items} accent={agent.color} />

      {view === 'resumen' && <Resumen items={items} accent={agent.color} onGo={setView} />}
      {view === 'crear' && <Crear agent={agent} autos={autos} onSave={(p) => { add(p); setView('galeria'); }} />}
      {view === 'galeria' && <Galeria items={items} accent={agent.color} onRemove={remove} onGo={() => setView('crear')} />}
      {view === 'automatizaciones' && <AutomationsPanel autos={autos} accent={agent.color} title="Automatizaciones de Cereus" />}

      <QuickActionsBar
        accent={agent.color}
        actions={[
          { label: 'Nueva pieza', icon: Plus, onClick: () => setView('crear') },
          { label: 'Galería', icon: Layers, onClick: () => setView('galeria') },
          { label: 'Pásalo a Nopal', icon: Sparkles, href: '/apps/nopal' },
          { label: 'Visual con Pitaya', icon: ImageIcon, href: '/apps/pitaya' },
        ]}
      />
    </AgentAppShell>
  );
}

function Kpis({ items, accent }: { items: Piece[]; accent: string }) {
  const kinds = new Set(items.map((i) => i.kind)).size;
  const productos = items.filter((i) => i.kind === 'producto').length;
  const data: Kpi[] = [
    { label: 'Piezas creadas', value: items.length, icon: <Layers className="h-4 w-4" /> },
    { label: 'Tipos cubiertos', value: kinds, icon: <Palette className="h-4 w-4" /> },
    { label: 'Productos', value: productos, icon: <Tag className="h-4 w-4" /> },
    { label: 'Estudio', value: 'Cereus', icon: <Shirt className="h-4 w-4" />, hint: 'Moda & Producto' },
  ];
  return <KpiRow items={data} accent={accent} />;
}

function Resumen({ items, accent, onGo }: { items: Piece[]; accent: string; onGo: (v: View) => void }) {
  const byKind = KINDS.map((k) => ({ ...k, n: items.filter((i) => i.kind === k.key).length }));
  const max = Math.max(1, ...byKind.map((k) => k.n));
  const recent = [...items].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  if (items.length === 0) {
    return <div className="rounded-2xl border border-border bg-card p-8"><EmptyState icon={Shirt} title="Tu estudio está listo" text="Crea tu primera descripción, colección o campaña con Cereus." accent={accent} cta={{ label: 'Crear pieza', onClick: () => onGo('crear') }} /></div>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2"><Palette className="h-4 w-4" style={{ color: accent }} /><h3 className="font-display font-semibold">Producción por tipo</h3></div>
          <div className="space-y-2.5">
            {byKind.filter((k) => k.n > 0).map((k) => (
              <div key={k.key}>
                <div className="mb-1 flex items-center justify-between text-xs"><span className="font-medium">{k.label}</span><span className="text-muted-foreground">{k.n}</span></div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(k.n / max) * 100}%`, backgroundColor: accent }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-display font-semibold">Recientes</h3><button onClick={() => onGo('galeria')} className="text-xs font-medium" style={{ color: accent }}>Ver galería →</button></div>
          <ul className="space-y-2.5">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: accent + '14', color: accent }}><Shirt className="h-3.5 w-3.5" /></span>
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{p.title}</div><div className="text-[11px] text-muted-foreground">{KIND[p.kind].label}</div></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <aside className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-2 font-display font-semibold">Qué puede crear Cereus</h3>
        <ul className="space-y-2.5">
          {KINDS.map((k) => (
            <li key={k.key} className="rounded-xl border border-border p-2.5"><div className="text-sm font-medium">{k.label}</div><div className="text-[11px] text-muted-foreground">{k.hint}</div></li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function Crear({ agent, autos, onSave }: { agent: CereusAgent; autos: ReturnType<typeof useAutomations>; onSave: (p: Piece) => void }) {
  const [kind, setKind] = useState<KindKey>('producto');
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function generate() {
    if (!title.trim() || loading) return;
    setLoading(true); setError(null); setResult(null);
    const extras: string[] = [];
    if (kind === 'producto' && autos.isOn('seo-tags')) extras.push('Incluye al final una línea "Etiquetas SEO:" con 5-8 palabras clave de búsqueda.');
    if (kind === 'campana' && autos.isOn('multichannel')) extras.push('Entrega una versión corta para redes y una larga para la tienda.');
    if (kind === 'ficha' && autos.isOn('sizing-note')) extras.push('Añade una guía de tallas y notas de cuidado del producto.');
    const prompt = `Eres Cereus, director creativo de un estudio de moda y producto. Crea: "${KIND[kind].label}" para: ${title.trim()}.${context.trim() ? `\nContexto/marca: ${context.trim()}` : ''}
Escribe en español, con voz de marca cuidada y editorial. Usa encabezados y viñetas donde aporte. Listo para publicar, sin preámbulo.${extras.length ? '\n' + extras.join('\n') : ''}`;
    try {
      const res = await fetch('/api/cactus/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: agent.slug, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar.');
      setResult(String(data.content || '').trim());
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoading(false); }
  }

  const [copied, setCopied] = useState(false);
  async function copy() { if (!result) return; try { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ } }
  function save() { if (!result) return; onSave({ id: uid(), kind, title: title.trim(), context: context.trim(), content: result, createdAt: Date.now() }); }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 font-display text-lg font-semibold">Nueva pieza</h3>
        <Field label="Tipo"><Select value={kind} onChange={(v) => setKind(v as KindKey)} options={KINDS.map((k) => ({ value: k.key, label: k.label }))} /></Field>
        <Field label="Producto / colección"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. abrigo de lana oversize" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></Field>
        <Field label="Contexto de marca (opcional)"><textarea value={context} onChange={(e) => setContext(e.target.value)} rows={3} placeholder="Ej. marca minimalista, sostenible, público joven" className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></Field>
        <button onClick={generate} disabled={loading || !title.trim()} className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: agent.color }}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}{loading ? 'Creando…' : 'Crear con Cereus'}
        </button>
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Resultado</h3>
          {result && <div className="flex items-center gap-1.5">
            <button onClick={copy} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted">{copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copiar</button>
            <button onClick={save} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: agent.color }}><Check className="h-3.5 w-3.5" /> Guardar</button>
          </div>}
        </div>
        {!result && !loading && <EmptyState icon={Sparkles} title="Tu pieza aparecerá aquí" text="Elige el tipo, da el producto y Cereus la redacta lista para publicar." accent={agent.color} />}
        {loading && <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cereus está creando…</div>}
        {result && <Markdown text={result} className="text-sm leading-relaxed text-foreground/90" />}
      </div>
    </div>
  );
}

function Galeria({ items, accent, onRemove, onGo }: { items: Piece[]; accent: string; onRemove: (id: string) => void; onGo: () => void }) {
  if (items.length === 0) return <div className="rounded-2xl border border-border bg-card p-5"><EmptyState icon={Layers} title="Galería vacía" text="Crea tu primera pieza y guárdala aquí." accent={accent} cta={{ label: 'Crear pieza', onClick: onGo }} /></div>;
  return <div className="space-y-3">{[...items].sort((a, b) => b.createdAt - a.createdAt).map((p) => <PieceCard key={p.id} p={p} accent={accent} onRemove={() => onRemove(p.id)} />)}</div>;
}

function PieceCard({ p, accent, onRemove }: { p: Piece; accent: string; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  async function copy() { try { await navigator.clipboard.writeText(p.content); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ } }
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: accent + '14', color: accent }}><Shirt className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{p.title}</div><div className="text-[11px] text-muted-foreground">{KIND[p.kind].label}</div></div>
        <button onClick={copy} title="Copiar" className="rounded p-1.5 text-muted-foreground hover:bg-muted">{copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</button>
        <button onClick={onRemove} title="Eliminar" className="rounded p-1.5 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
        <button onClick={() => setOpen((o) => !o)} className="rounded p-1.5 text-muted-foreground hover:bg-muted"><ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} /></button>
      </div>
      {open && <Markdown text={p.content} className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-foreground/90" />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-3"><label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>{children}</div>;
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none">{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}
function EmptyState({ icon: Icon, title, text, cta, accent }: { icon: typeof Shirt; title: string; text: string; cta?: { label: string; onClick: () => void }; accent: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: accent + '14', color: accent }}><Icon className="h-6 w-6" /></span>
      <h4 className="font-display font-semibold">{title}</h4>
      <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
      {cta && <button onClick={cta.onClick} className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white" style={{ backgroundColor: accent }}><Plus className="h-4 w-4" /> {cta.label}</button>}
    </div>
  );
}
