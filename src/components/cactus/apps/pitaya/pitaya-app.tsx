'use client';

import { useEffect, useRef, useState } from 'react';
import {
  PanelsTopLeft, CheckCircle2, Plug, Send, Loader2, Sparkles, Wand2, Copy, Check,
  Trash2, Megaphone, Mail, LayoutTemplate, Quote, Eye, ThumbsUp, FileText,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { QuickActionsBar } from '@/components/cactus/app-shell/quick-actions-bar';

interface PitayaAgent { slug: string; name: string; role: string; color: string; image: string }

// ── Tipos de pieza de copy (master spec: ads / email / landing / slogan) ──────
const TYPES = [
  { key: 'anuncio', label: 'Anuncio', icon: Megaphone, hint: 'Titular + cuerpo + CTA' },
  { key: 'email', label: 'Email', icon: Mail, hint: 'Asunto + cuerpo' },
  { key: 'landing', label: 'Landing', icon: LayoutTemplate, hint: 'Hero + beneficios + CTA' },
  { key: 'slogan', label: 'Slogan', icon: Quote, hint: 'Frase de marca' },
] as const;
type TypeKey = (typeof TYPES)[number]['key'];
const TYPE = Object.fromEntries(TYPES.map((t) => [t.key, t])) as Record<TypeKey, (typeof TYPES)[number]>;

const TYPE_INSTRUCTION: Record<TypeKey, string> = {
  anuncio: 'Primera línea = titular corto y potente; 1-2 líneas de cuerpo; última línea = llamada a la acción. Sin etiquetas ni comillas.',
  email: 'Primera línea = asunto; luego el cuerpo del email listo para enviar. Sin etiquetas ni comillas.',
  landing: 'Primera línea = titular principal; segunda línea = subtítulo; luego 3 beneficios en viñetas que empiecen con "- "; última línea = texto del botón CTA. Sin etiquetas.',
  slogan: 'Devuelve solo un slogan corto y memorable (máximo 8 palabras). Sin comillas ni explicación.',
};

interface Piece {
  id: string;
  type: TypeKey;
  brief: string;
  content: string;
  approved: boolean;
  createdAt: number;
}
interface ChatMsg { role: 'user' | 'assistant'; content: string }

const PIECES_KEY = 'cactus.pitaya.pieces.v1';
const CHAT_KEY = 'cactus.pitaya.chat.v1';
const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

type View = 'workspace' | 'aprobadas';

export function PitayaApp({
  agent, user, credits,
}: {
  agent: PitayaAgent; user?: ShellUser; credits?: number;
}) {
  const [view, setView] = useState<View>('workspace');
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PIECES_KEY);
      if (raw) {
        const p: Piece[] = JSON.parse(raw);
        setPieces(p);
        if (p.length) setSelectedId(p[0].id);
      }
    } catch { /* noop */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(PIECES_KEY, JSON.stringify(pieces)); } catch { /* noop */ }
  }, [pieces, loaded]);

  const addPiece = (p: Piece) => { setPieces((prev) => [p, ...prev]); setSelectedId(p.id); };
  const removePiece = (id: string) => setPieces((prev) => {
    const next = prev.filter((x) => x.id !== id);
    setSelectedId((s) => (s === id ? (next[0]?.id ?? null) : s));
    return next;
  });
  const toggleApprove = (id: string) =>
    setPieces((prev) => prev.map((x) => (x.id === id ? { ...x, approved: !x.approved } : x)));

  const selected = pieces.find((p) => p.id === selectedId) || null;
  const firstName = user?.name?.split(' ')[0];

  const nav: AppNavItem[] = [
    { key: 'workspace', label: 'Workspace', icon: PanelsTopLeft },
    { key: 'aprobadas', label: 'Aprobadas', icon: CheckCircle2 },
    { key: 'conexiones', label: 'Conexiones', icon: Plug, href: '/empresa', section: 'Cuenta' },
  ];

  return (
    <AgentAppShell
      agent={agent}
      nav={nav}
      activeNav={view}
      onNav={(k) => { if (k !== 'conexiones') setView(k as View); }}
      user={user}
      credits={credits}
      greeting={`Hola${firstName ? `, ${firstName}` : ''} ✍️`}
      subtitle="Estudio de copy creativo con Pitaya"
    >
      <Kpis pieces={pieces} accent={agent.color} />

      {view === 'workspace' ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]">
          <ChatPanel agent={agent} />
          <PiecesPanel
            agent={agent} pieces={pieces} selectedId={selectedId}
            onAdd={addPiece} onSelect={setSelectedId} onRemove={removePiece} onApprove={toggleApprove}
          />
          <PreviewPanel piece={selected} accent={agent.color} onApprove={toggleApprove} />
        </div>
      ) : (
        <Aprobadas pieces={pieces} accent={agent.color} onApprove={toggleApprove} onRemove={removePiece} onGo={() => setView('workspace')} />
      )}

      <QuickActionsBar
        accent={agent.color}
        actions={[
          { label: 'Nueva pieza', icon: Wand2, onClick: () => setView('workspace') },
          { label: 'Aprobadas', icon: CheckCircle2, onClick: () => setView('aprobadas') },
          { label: 'Pídele a Ramona', icon: Sparkles, href: '/orchestrator' },
          { label: 'Conexiones', icon: Plug, href: '/empresa' },
        ]}
      />
    </AgentAppShell>
  );
}

// ── KPIs ──────────────────────────────────────────────────────────────────────
function Kpis({ pieces, accent }: { pieces: Piece[]; accent: string }) {
  const approved = pieces.filter((p) => p.approved).length;
  const types = new Set(pieces.map((p) => p.type)).size;
  const items: Kpi[] = [
    { label: 'Piezas', value: pieces.length, icon: <FileText className="h-4 w-4" /> },
    { label: 'Aprobadas', value: approved, icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: 'En revisión', value: pieces.length - approved, icon: <Eye className="h-4 w-4" /> },
    { label: 'Formatos', value: types, icon: <LayoutTemplate className="h-4 w-4" /> },
  ];
  return <KpiRow items={items} accent={accent} />;
}

// ── Chat con Pitaya (real, vía router de IA) ──────────────────────────────────
function ChatPanel({ agent }: { agent: PitayaAgent }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(CHAT_KEY); if (raw) setMessages(JSON.parse(raw)); } catch { /* noop */ }
    loadedRef.current = true;
  }, []);
  useEffect(() => {
    if (loadedRef.current) { try { localStorage.setItem(CHAT_KEY, JSON.stringify(messages)); } catch { /* noop */ } }
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const SUGGESTIONS = ['Dame 3 ángulos para esta campaña', 'Escribe un titular potente', 'Ideas de gancho para el primer segundo'];

  async function send(text?: string) {
    const t = (text ?? input).trim();
    if (!t || loading) return;
    setError(null);
    const next = [...messages, { role: 'user' as const, content: t }];
    setMessages(next); setInput(''); setLoading(true);
    try {
      const res = await fetch('/api/cactus/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: agent.slug, messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setMessages((m) => [...m, { role: 'assistant', content: data.content }]);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally { setLoading(false); }
  }

  return (
    <div className="flex h-[560px] flex-col rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="h-4 w-4" style={{ color: agent.color }} />
        <h3 className="font-display font-semibold">Chat con Pitaya</h3>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground">
            <p>Hola, soy Pitaya. Cuéntame de tu campaña, marca o producto y trabajamos los ángulos y el copy juntos.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground" style={{ ['--c' as string]: agent.color }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${m.role === 'user' ? 'text-white' : 'bg-muted text-foreground'}`}
              style={m.role === 'user' ? { backgroundColor: agent.color } : undefined}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="rounded-2xl bg-muted px-3.5 py-2"><Loader2 className="h-4 w-4 animate-spin" /></div></div>}
        {error && <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        <div ref={endRef} />
      </div>
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            placeholder="Escribe a Pitaya…"
            className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} className="flex h-9 w-9 items-center justify-center rounded-lg text-white disabled:opacity-50" style={{ backgroundColor: agent.color }}>
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Piezas generadas (generador tipado + lista) ───────────────────────────────
function PiecesPanel({
  agent, pieces, selectedId, onAdd, onSelect, onRemove, onApprove,
}: {
  agent: PitayaAgent; pieces: Piece[]; selectedId: string | null;
  onAdd: (p: Piece) => void; onSelect: (id: string) => void; onRemove: (id: string) => void; onApprove: (id: string) => void;
}) {
  const [type, setType] = useState<TypeKey>('anuncio');
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    const b = brief.trim();
    if (!b || loading) return;
    setLoading(true); setError(null);
    const prompt = `Crea una pieza de copy tipo "${TYPE[type].label}".\nBriefing: ${b}\nFormato: ${TYPE_INSTRUCTION[type]}`;
    try {
      const res = await fetch('/api/cactus/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: agent.slug, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar.');
      onAdd({ id: uid(), type, brief: b, content: String(data.content || '').trim(), approved: false, createdAt: Date.now() });
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally { setLoading(false); }
  }

  return (
    <div className="flex h-[560px] flex-col rounded-2xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="mb-3 font-display font-semibold">Generar pieza</h3>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {TYPES.map((t) => {
            const active = t.key === type;
            return (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${active ? 'text-white' : 'border border-border text-muted-foreground hover:bg-muted'}`}
                style={active ? { backgroundColor: agent.color } : undefined}
              >
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            );
          })}
        </div>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={2}
          placeholder={`Briefing para tu ${TYPE[type].label.toLowerCase()}…`}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
        />
        <button
          onClick={generate}
          disabled={loading || !brief.trim()}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: agent.color }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? 'Escribiendo…' : `Generar ${TYPE[type].label.toLowerCase()}`}
        </button>
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {pieces.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Sparkles className="h-6 w-6 opacity-50" />
            <p className="max-w-[16rem] text-sm">Tus piezas de copy aparecerán aquí. Elige un formato y dale un briefing.</p>
          </div>
        ) : (
          pieces.map((p) => (
            <PieceCard
              key={p.id} p={p} accent={agent.color} active={p.id === selectedId}
              onSelect={() => onSelect(p.id)} onRemove={() => onRemove(p.id)} onApprove={() => onApprove(p.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PieceCard({
  p, accent, active, onSelect, onRemove, onApprove,
}: {
  p: Piece; accent: string; active: boolean; onSelect: () => void; onRemove: () => void; onApprove: () => void;
}) {
  const t = TYPE[p.type];
  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-xl border bg-background p-3 transition-colors ${active ? '' : 'border-border hover:bg-muted/50'}`}
      style={active ? { borderColor: accent, boxShadow: `0 0 0 1px ${accent}` } : undefined}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: accent }}>
          <t.icon className="h-3.5 w-3.5" /> {t.label}
        </span>
        <div className="flex items-center gap-1">
          {p.approved && <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700"><Check className="h-3 w-3" /> Aprobada</span>}
          <button onClick={(e) => { e.stopPropagation(); onApprove(); }} title={p.approved ? 'Quitar aprobación' : 'Aprobar'} className="rounded p-1 text-muted-foreground hover:bg-muted"><ThumbsUp className="h-3.5 w-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} title="Eliminar" className="rounded p-1 text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-snug text-foreground/85">{p.content}</p>
    </div>
  );
}

// ── Preview & aprobación ──────────────────────────────────────────────────────
function PreviewPanel({ piece, accent, onApprove }: { piece: Piece | null; accent: string; onApprove: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    if (!piece) return;
    try { await navigator.clipboard.writeText(piece.content); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
  }
  return (
    <div className="hidden h-[560px] flex-col rounded-2xl border border-border bg-card xl:flex">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Eye className="h-4 w-4" style={{ color: accent }} />
        <h3 className="font-display font-semibold">Preview & aprobación</h3>
      </div>
      {!piece ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
          <Eye className="h-6 w-6 opacity-50" />
          <p className="text-sm">Selecciona una pieza para previsualizarla en contexto.</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            <PiecePreview piece={piece} accent={accent} />
          </div>
          <div className="flex items-center gap-2 border-t border-border p-3">
            <button
              onClick={() => onApprove(piece.id)}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold ${piece.approved ? 'bg-emerald-100 text-emerald-700' : 'text-white'}`}
              style={piece.approved ? undefined : { backgroundColor: accent }}
            >
              {piece.approved ? <><Check className="h-4 w-4" /> Aprobada</> : <><ThumbsUp className="h-4 w-4" /> Aprobar</>}
            </button>
            <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Marco de previsualización según el tipo de pieza
function PiecePreview({ piece, accent }: { piece: Piece; accent: string }) {
  const lines = piece.content.split('\n').map((l) => l.trim()).filter(Boolean);
  const headline = lines[0] || piece.content;
  const rest = lines.slice(1);

  if (piece.type === 'slogan') {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-border bg-muted/30 p-6 text-center">
        <p className="font-display text-xl font-bold leading-snug" style={{ color: accent }}>{piece.content}</p>
      </div>
    );
  }
  if (piece.type === 'email') {
    return (
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">Para: tus suscriptores</div>
        <div className="border-b border-border px-3 py-2 text-sm font-semibold">{headline}</div>
        <div className="whitespace-pre-wrap px-3 py-3 text-sm leading-relaxed text-foreground/90">{rest.join('\n')}</div>
      </div>
    );
  }
  if (piece.type === 'landing') {
    const cta = rest[rest.length - 1];
    const sub = rest[0];
    const bullets = rest.slice(1, -1).filter((l) => l.startsWith('-')).map((l) => l.replace(/^-\s*/, ''));
    return (
      <div className="rounded-xl border border-border bg-gradient-to-b from-muted/40 to-background p-5 text-center">
        <h2 className="font-display text-xl font-bold leading-tight">{headline}</h2>
        {sub && <p className="mt-1.5 text-sm text-muted-foreground">{sub}</p>}
        {bullets.length > 0 && (
          <ul className="mx-auto mt-4 max-w-xs space-y-1.5 text-left text-sm">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} /> {b}</li>
            ))}
          </ul>
        )}
        {cta && <span className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: accent }}>{cta}</span>}
      </div>
    );
  }
  // anuncio (social ad mock)
  const cta = rest.length > 1 ? rest[rest.length - 1] : undefined;
  const body = cta ? rest.slice(0, -1).join('\n') : rest.join('\n');
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="h-8 w-8 rounded-full" style={{ backgroundColor: accent }} />
        <div className="leading-tight">
          <div className="text-xs font-semibold">Tu marca</div>
          <div className="text-[10px] text-muted-foreground">Patrocinado</div>
        </div>
      </div>
      <div className="px-3 pb-2 text-sm font-semibold">{headline}</div>
      {body && <div className="whitespace-pre-wrap px-3 pb-2 text-sm text-foreground/85">{body}</div>}
      <div className="flex aspect-video items-center justify-center bg-muted text-xs text-muted-foreground">Visual de Cardón / Lente</div>
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <span className="text-xs text-muted-foreground">tumarca.com</span>
        <span className="rounded-md px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: accent }}>{cta || 'Más información'}</span>
      </div>
    </div>
  );
}

// ── Vista "Aprobadas" ─────────────────────────────────────────────────────────
function Aprobadas({
  pieces, accent, onApprove, onRemove, onGo,
}: {
  pieces: Piece[]; accent: string; onApprove: (id: string) => void; onRemove: (id: string) => void; onGo: () => void;
}) {
  const approved = pieces.filter((p) => p.approved);
  if (approved.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: accent + '14', color: accent }}>
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h4 className="mt-2 font-display font-semibold">Sin piezas aprobadas todavía</h4>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Genera copy en el workspace y aprueba lo que te guste para tenerlo listo aquí.</p>
        <button onClick={onGo} className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white" style={{ backgroundColor: accent }}>
          <Sparkles className="h-4 w-4" /> Ir al workspace
        </button>
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {approved.map((p) => (
        <PieceCard key={p.id} p={p} accent={accent} active={false} onSelect={() => {}} onRemove={() => onRemove(p.id)} onApprove={() => onApprove(p.id)} />
      ))}
    </div>
  );
}
