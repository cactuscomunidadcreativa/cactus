'use client';

import { useEffect, useState } from 'react';
import { Markdown } from '@/components/cactus/shared/markdown';
import Link from 'next/link';
import {
  LayoutDashboard, FilePlus2, ScrollText, Plug, Wand2, Loader2, Copy, Check, Trash2,
  ChevronDown, BarChart3, FileSignature, ShieldCheck, Sparkles,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { QuickActionsBar } from '@/components/cactus/app-shell/quick-actions-bar';
import { DocAttach, withDoc, type Attached } from '@/components/cactus/apps/shared/doc-attach';

interface FeroAgent { slug: string; name: string; role: string; color: string; image: string }

// ── Tipos de documento (master spec: cotizaciones, contratos, términos, docx) ─
const DOCS = [
  { key: 'cotizacion', label: 'Cotización' },
  { key: 'servicios', label: 'Contrato de servicios' },
  { key: 'nda', label: 'NDA (confidencialidad)' },
  { key: 'terminos', label: 'Términos y condiciones' },
  { key: 'orden', label: 'Orden de servicio' },
] as const;
type DocKey = (typeof DOCS)[number]['key'];
const DOC = Object.fromEntries(DOCS.map((d) => [d.key, d])) as Record<DocKey, (typeof DOCS)[number]>;

interface Doc {
  id: string;
  kind: DocKey;
  client: string;
  provider: string;
  scope: string;
  amount: string;
  term: string;
  content: string;
  createdAt: number;
}

const STORAGE_KEY = 'cactus.ferocactus.docs.v1';
const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

type View = 'resumen' | 'generar' | 'documentos';

export function FerocactusApp({
  agent, user, credits,
}: {
  agent: FeroAgent; user?: ShellUser; credits?: number;
}) {
  const [view, setView] = useState<View>('resumen');
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setDocs(JSON.parse(raw)); } catch { /* noop */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(docs)); } catch { /* noop */ }
  }, [docs, loaded]);

  const add = (d: Doc) => setDocs((prev) => [d, ...prev]);
  const remove = (id: string) => setDocs((prev) => prev.filter((x) => x.id !== id));

  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [
    { key: 'resumen', label: 'Resumen', icon: LayoutDashboard },
    { key: 'generar', label: 'Nuevo documento', icon: FilePlus2 },
    { key: 'documentos', label: 'Documentos', icon: ScrollText },
    { key: 'conexiones', label: 'Firma & Drive', icon: Plug, href: '/empresa', section: 'Cuenta' },
  ];

  return (
    <AgentAppShell
      agent={agent}
      nav={nav}
      activeNav={view}
      onNav={(k) => { if (k !== 'conexiones') setView(k as View); }}
      user={user}
      credits={credits}
      greeting={`Hola${firstName ? `, ${firstName}` : ''} 📄`}
      subtitle="Contratos y documentos con Ferocactus"
      cta={{ label: 'Nuevo documento', icon: FilePlus2, onClick: () => setView('generar') }}
    >
      <Kpis docs={docs} accent={agent.color} />

      {view === 'resumen' && <Resumen docs={docs} accent={agent.color} onGo={setView} />}
      {view === 'generar' && <Generar agent={agent} provider={user?.name} onSave={add} onGoList={() => setView('documentos')} />}
      {view === 'documentos' && <Lista docs={docs} accent={agent.color} onRemove={remove} onGo={() => setView('generar')} />}

      <QuickActionsBar
        accent={agent.color}
        actions={[
          { label: 'Nuevo documento', icon: FilePlus2, onClick: () => setView('generar') },
          { label: 'Mis documentos', icon: ScrollText, onClick: () => setView('documentos') },
          { label: 'Revisión legal con Huernia', icon: ShieldCheck, href: '/agent/huernia' },
          { label: 'Conectar firma', icon: Plug, href: '/empresa' },
        ]}
      />
    </AgentAppShell>
  );
}

// ── KPIs (honestos) ────────────────────────────────────────────────────────────
function Kpis({ docs, accent }: { docs: Doc[]; accent: string }) {
  const kinds = new Set(docs.map((d) => d.kind)).size;
  const data: Kpi[] = [
    { label: 'Documentos', value: docs.length, icon: <ScrollText className="h-4 w-4" /> },
    { label: 'Tipos usados', value: kinds, icon: <FilePlus2 className="h-4 w-4" /> },
    { label: 'Firmas pendientes', value: '—', icon: <FileSignature className="h-4 w-4" />, hint: 'Conecta firma electrónica' },
    { label: 'En Drive', value: '—', icon: <Plug className="h-4 w-4" />, hint: 'Conecta Drive (Fase F)' },
  ];
  return <KpiRow items={data} accent={accent} />;
}

// ── Resumen ────────────────────────────────────────────────────────────────────
function Resumen({ docs, accent, onGo }: { docs: Doc[]; accent: string; onGo: (v: View) => void }) {
  const byKind = DOCS.map((d) => ({ ...d, count: docs.filter((x) => x.kind === d.key).length }));
  const max = Math.max(1, ...byKind.map((d) => d.count));
  const recent = [...docs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
      <div className="space-y-5">
        {/* Firma & Drive — bloqueado hasta conectar */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <FileSignature className="h-4 w-4" style={{ color: accent }} />
            <h3 className="font-display font-semibold">Firma electrónica & archivo</h3>
          </div>
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center">
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Envía a firma, sigue el estado y archiva en Drive automáticamente al conectar tus servicios.
              Por ahora, Ferocactus redacta el documento y tú lo descargas/copias.
            </p>
            <Link href="/empresa" className="mt-2 inline-block text-xs font-semibold" style={{ color: accent }}>Conectar firma & Drive →</Link>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Por tipo — real */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" style={{ color: accent }} />
              <h3 className="font-display font-semibold">Documentos por tipo</h3>
            </div>
            {docs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Aún no has creado documentos.</p>
            ) : (
              <div className="space-y-2.5">
                {byKind.filter((d) => d.count > 0).map((d) => (
                  <div key={d.key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium">{d.label}</span>
                      <span className="text-muted-foreground">{d.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${(d.count / max) * 100}%`, backgroundColor: accent }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recientes — real */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <ScrollText className="h-4 w-4" style={{ color: accent }} />
              <h3 className="font-display font-semibold">Documentos recientes</h3>
            </div>
            {recent.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">Nada todavía.</p>
                <button onClick={() => onGo('generar')} className="mt-2 text-xs font-medium" style={{ color: accent }}>Crear documento →</button>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {recent.map((d) => (
                  <li key={d.id} className="min-w-0">
                    <div className="truncate text-sm font-medium">{DOC[d.kind].label}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{d.client || 'Sin cliente'}{d.amount ? ` · ${d.amount}` : ''}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-2 font-display font-semibold">Cómo trabaja Ferocactus</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <Step n={1} accent={accent}>Le das tipo de documento y las partes.</Step>
            <Step n={2} accent={accent}>Redacta cláusulas claras con campos a llenar.</Step>
            <Step n={3} accent={accent}>Huernia lo revisa en clave legal.</Step>
            <Step n={4} accent={accent}>Al conectar firma, lo envías y archivas.</Step>
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[11px] leading-relaxed text-amber-900">
            <strong>Aviso:</strong> los documentos son borradores generados por IA. Revísalos con un abogado antes de firmar.
            Ferocactus no sustituye asesoría legal.
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

// ── Generar documento (núcleo funcional vía router de IA) ─────────────────────
function Generar({ agent, provider, onSave, onGoList }: { agent: FeroAgent; provider?: string; onSave: (d: Doc) => void; onGoList: () => void }) {
  const [kind, setKind] = useState<DocKey>('cotizacion');
  const [client, setClient] = useState('');
  const [prov, setProv] = useState(provider || '');
  const [scope, setScope] = useState('');
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [doc, setDoc] = useState<Attached | null>(null);

  async function generate() {
    if (!scope.trim() || loading) return;
    setLoading(true); setError(null); setResult(null);
    const prompt = withDoc(
      `Redacta un documento tipo "${DOC[kind].label}" en español, listo para revisar.\n` +
      `Partes: Proveedor: ${prov.trim() || 'la empresa'}; Cliente: ${client.trim() || '[Cliente]'}.\n` +
      `Objeto / alcance: ${scope.trim()}.\n` +
      `Monto / condiciones económicas: ${amount.trim() || 'según propuesta'}.\n` +
      `Vigencia / plazos: ${term.trim() || 'a convenir'}.\n` +
      `Estructura el documento con cláusulas o numerales claros, formal pero legible. ` +
      `Usa campos entre corchetes [ ] donde falten datos. ` +
      `Empieza con la línea exacta: "— Borrador generado por IA; revísalo con tu abogado antes de firmar —". Sin texto adicional fuera del documento.`,
      doc, 'Toma como base / referencia este documento',
    );
    try {
      const res = await fetch('/api/cactus/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: agent.slug, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo redactar.');
      setResult(String(data.content || '').trim());
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally { setLoading(false); }
  }

  function save() {
    if (!result) return;
    onSave({
      id: uid(), kind, client: client.trim(), provider: prov.trim(), scope: scope.trim(),
      amount: amount.trim(), term: term.trim(), content: result, createdAt: Date.now(),
    });
    onGoList();
  }
  async function copy() {
    if (!result) return;
    try { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 font-display text-lg font-semibold">Nuevo documento</h3>
        <Field label="Tipo de documento">
          <Select value={kind} onChange={(v) => setKind(v as DocKey)} options={DOCS.map((d) => ({ value: d.key, label: d.label }))} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cliente">
            <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nombre / empresa" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
          </Field>
          <Field label="Proveedor">
            <input value={prov} onChange={(e) => setProv(e.target.value)} placeholder="Tu empresa" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
          </Field>
        </div>
        <Field label="Objeto / alcance">
          <textarea value={scope} onChange={(e) => setScope(e.target.value)} rows={3} placeholder="Qué se contrata o cotiza, entregables…" className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Monto / condiciones">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ej. $25,000 + IVA" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
          </Field>
          <Field label="Vigencia / plazos">
            <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Ej. 6 meses" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
          </Field>
        </div>
        <div className="mb-3"><DocAttach accent={agent.color} attached={doc} onChange={setDoc} label="Adjuntar documento base" /></div>
        <button
          onClick={generate}
          disabled={loading || !scope.trim()}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: agent.color }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? 'Redactando…' : 'Redactar con Ferocactus'}
        </button>
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Documento</h3>
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
          <EmptyState icon={ScrollText} title="Tu documento aparecerá aquí" text="Elige el tipo, define las partes y el alcance; Ferocactus redacta el borrador." accent={agent.color} />
        )}
        {loading && (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Ferocactus está redactando…
          </div>
        )}
        {result && (
          <div className="rounded-xl border border-border bg-background p-4">
            <Markdown text={result} className="font-mono text-[13px] leading-relaxed text-foreground/90" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Lista de documentos ────────────────────────────────────────────────────────
function Lista({ docs, accent, onRemove, onGo }: { docs: Doc[]; accent: string; onRemove: (id: string) => void; onGo: () => void }) {
  if (docs.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <EmptyState icon={ScrollText} title="Sin documentos todavía" text="Redacta una cotización o contrato y guárdalo para tenerlo a la mano." cta={{ label: 'Nuevo documento', onClick: onGo }} accent={accent} />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {[...docs].sort((a, b) => b.createdAt - a.createdAt).map((d) => (
        <DocCard key={d.id} d={d} accent={accent} onRemove={() => onRemove(d.id)} />
      ))}
    </div>
  );
}

function DocCard({ d, accent, onRemove }: { d: Doc; accent: string; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(d.content); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: accent + '14', color: accent }}>
          <ScrollText className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{DOC[d.kind].label}{d.client ? ` · ${d.client}` : ''}</div>
          <div className="truncate text-[11px] text-muted-foreground">{d.scope || 'Sin objeto'}{d.amount ? ` · ${d.amount}` : ''}</div>
        </div>
        <button onClick={copy} title="Copiar" className="rounded p-1.5 text-muted-foreground hover:bg-muted">
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
        <button onClick={onRemove} title="Eliminar" className="rounded p-1.5 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
        <button onClick={() => setOpen((o) => !o)} className="rounded p-1.5 text-muted-foreground hover:bg-muted">
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <div className="mt-3 rounded-xl border border-border bg-background p-4">
          <div className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-foreground/90">{d.content}</div>
        </div>
      )}
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
  icon: typeof ScrollText; title: string; text: string; cta?: { label: string; onClick: () => void }; accent: string;
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
          <FilePlus2 className="h-4 w-4" /> {cta.label}
        </button>
      )}
    </div>
  );
}
