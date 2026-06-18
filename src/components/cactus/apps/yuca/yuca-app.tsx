'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Sun, LineChart, Users, MessageCircle, Plus, Trash2, Check, Loader2, Sparkles,
  Flame, Send, Minus, Heart, Lightbulb, CalendarClock,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { QuickActionsBar } from '@/components/cactus/app-shell/quick-actions-bar';

interface YucaAgent { slug: string; name: string; role: string; color: string; image: string }

// ── Fecha (cliente) ───────────────────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0, 10);
const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

// ── Señales personales del check-in ───────────────────────────────────────────
type MetricKind = 'scale' | 'number' | 'count';
const METRICS: { key: string; label: string; emoji: string; kind: MetricKind; step?: number; unit?: string }[] = [
  { key: 'mood', label: 'Ánimo', emoji: '😊', kind: 'scale' },
  { key: 'energy', label: 'Energía', emoji: '⚡', kind: 'scale' },
  { key: 'sleep', label: 'Sueño', emoji: '😴', kind: 'number', step: 0.5, unit: 'h' },
  { key: 'water', label: 'Agua', emoji: '💧', kind: 'count', unit: 'vasos' },
  { key: 'weight', label: 'Peso', emoji: '⚖️', kind: 'number', step: 0.1, unit: 'kg' },
];

interface DayLog { date: string; mood?: number; energy?: number; sleep?: number; water?: number; weight?: number }
interface Habit { id: string; name: string; emoji: string; done: Record<string, boolean> }
interface Relation { id: string; name: string; bond: string; feeling: number; last: string; note: string }

const LOGS_KEY = 'cactus.yuca.logs.v1';
const HABITS_KEY = 'cactus.yuca.habits.v1';
const RELS_KEY = 'cactus.yuca.relations.v1';
const CHAT_KEY = 'cactus.yuca.chat.v1';

function useStored<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [val, setVal] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { try { const raw = localStorage.getItem(key); if (raw) setVal(JSON.parse(raw)); } catch { /* noop */ } setLoaded(true); }, [key]);
  useEffect(() => { if (loaded) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ } } }, [key, val, loaded]);
  return [val, setVal, loaded];
}

type View = 'hoy' | 'progreso' | 'relaciones' | 'coach';

export function YucaApp({ agent, user, credits }: { agent: YucaAgent; user?: ShellUser; credits?: number }) {
  const [view, setView] = useState<View>('hoy');
  const [logs, setLogs] = useStored<DayLog[]>(LOGS_KEY, []);
  const [habits, setHabits] = useStored<Habit[]>(HABITS_KEY, [
    { id: uid(), name: 'Meditar', emoji: '🧘', done: {} },
    { id: uid(), name: 'Moverme 30 min', emoji: '🏃', done: {} },
    { id: uid(), name: 'Leer', emoji: '📖', done: {} },
  ]);
  const [relations, setRelations] = useStored<Relation[]>(RELS_KEY, []);

  const today = todayKey();
  const todayLog = logs.find((l) => l.date === today) || { date: today };
  const setMetric = (key: string, value: number | undefined) =>
    setLogs((prev) => { const rest = prev.filter((l) => l.date !== today); return [...rest, { ...todayLog, [key]: value }]; });

  const toggleHabit = (id: string) =>
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, done: { ...h.done, [today]: !h.done[today] } } : h)));
  const addHabit = (name: string, emoji: string) => setHabits((prev) => [...prev, { id: uid(), name, emoji, done: {} }]);
  const removeHabit = (id: string) => setHabits((prev) => prev.filter((h) => h.id !== id));

  const firstName = user?.name?.split(' ')[0];
  const habitsDone = habits.filter((h) => h.done[today]).length;

  const nav: AppNavItem[] = [
    { key: 'hoy', label: 'Hoy', icon: Sun },
    { key: 'progreso', label: 'Progreso', icon: LineChart },
    { key: 'relaciones', label: 'Relaciones', icon: Users },
    { key: 'coach', label: 'Coach', icon: MessageCircle },
  ];

  const kpis: Kpi[] = [
    { label: 'Hábitos hoy', value: `${habitsDone}/${habits.length}`, icon: <Check className="h-4 w-4" /> },
    { label: 'Racha máx.', value: bestStreak(habits), icon: <Flame className="h-4 w-4" />, hint: 'días seguidos' },
    { label: 'Check-ins', value: logs.length, icon: <Sun className="h-4 w-4" /> },
    { label: 'Relaciones', value: relations.length, icon: <Heart className="h-4 w-4" /> },
  ];

  return (
    <AgentAppShell
      agent={agent}
      nav={nav}
      activeNav={view}
      onNav={(k) => setView(k as View)}
      user={user}
      credits={credits}
      greeting={`Hola${firstName ? `, ${firstName}` : ''} 🌱`}
      subtitle="Tu bienestar y hábitos con Yuca"
    >
      <KpiRow items={kpis} accent={agent.color} />

      {view === 'hoy' && <Hoy agent={agent} todayLog={todayLog} setMetric={setMetric} habits={habits} today={today} onToggle={toggleHabit} onAdd={addHabit} onRemove={removeHabit} logs={logs} />}
      {view === 'progreso' && <Progreso logs={logs} accent={agent.color} />}
      {view === 'relaciones' && <Relaciones relations={relations} setRelations={setRelations} accent={agent.color} />}
      {view === 'coach' && <Coach agent={agent} />}

      <QuickActionsBar
        accent={agent.color}
        actions={[
          { label: 'Check-in de hoy', icon: Sun, onClick: () => setView('hoy') },
          { label: 'Ver progreso', icon: LineChart, onClick: () => setView('progreso') },
          { label: 'Relaciones', icon: Users, onClick: () => setView('relaciones') },
          { label: 'Hablar con Yuca', icon: MessageCircle, onClick: () => setView('coach') },
        ]}
      />
    </AgentAppShell>
  );
}

function bestStreak(habits: Habit[]): number {
  let best = 0;
  for (const h of habits) {
    let s = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (h.done[d.toISOString().slice(0, 10)]) s++; else break;
    }
    if (s > best) best = s;
  }
  return best;
}

// ═══ HOY (check-in + hábitos + micro-insight) ═════════════════════════════════
function Hoy({
  agent, todayLog, setMetric, habits, today, onToggle, onAdd, onRemove, logs,
}: {
  agent: YucaAgent; todayLog: DayLog; setMetric: (k: string, v: number | undefined) => void;
  habits: Habit[]; today: string; onToggle: (id: string) => void; onAdd: (n: string, e: string) => void; onRemove: (id: string) => void; logs: DayLog[];
}) {
  const [newHabit, setNewHabit] = useState('');
  const c = agent.color;
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
      <div className="space-y-5">
        {/* Check-in */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-1 font-display text-lg font-semibold">¿Cómo vienes hoy?</h3>
          <p className="mb-4 text-sm text-muted-foreground">Registra tus señales. Toma 20 segundos.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {METRICS.map((m) => (
              <MetricInput key={m.key} m={m} value={(todayLog as any)[m.key]} accent={c} onChange={(v) => setMetric(m.key, v)} />
            ))}
          </div>
        </div>

        {/* Hábitos */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-display text-lg font-semibold">Hábitos de hoy</h3>
          <div className="space-y-2">
            {habits.map((h) => {
              const done = !!h.done[today];
              const streak = streakFor(h);
              return (
                <div key={h.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                  <button onClick={() => onToggle(h.id)} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${done ? 'text-white' : 'border-border text-transparent'}`} style={done ? { backgroundColor: c, borderColor: c } : undefined}>
                    <Check className="h-4 w-4" />
                  </button>
                  <span className="text-lg">{h.emoji}</span>
                  <span className={`flex-1 text-sm ${done ? 'font-medium' : ''}`}>{h.name}</span>
                  {streak > 0 && <span className="inline-flex items-center gap-1 text-xs text-amber-600"><Flame className="h-3.5 w-3.5" /> {streak}</span>}
                  <button onClick={() => onRemove(h.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input value={newHabit} onChange={(e) => setNewHabit(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newHabit.trim()) { onAdd(newHabit.trim(), '✨'); setNewHabit(''); } }} placeholder="Nuevo hábito…" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
            <button onClick={() => { if (newHabit.trim()) { onAdd(newHabit.trim(), '✨'); setNewHabit(''); } }} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white" style={{ backgroundColor: c }}><Plus className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <aside className="space-y-5">
        <MicroInsight agent={agent} logs={logs} habits={habits} />
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Yuca te acompaña en tu bienestar y hábitos. <strong>No sustituye consejo médico</strong>; si algo te preocupa, consulta a un profesional.
          </p>
        </div>
      </aside>
    </div>
  );
}

function streakFor(h: Habit): number {
  let s = 0;
  for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (h.done[d.toISOString().slice(0, 10)]) s++; else break; }
  return s;
}

function MetricInput({ m, value, accent, onChange }: { m: typeof METRICS[number]; value?: number; accent: string; onChange: (v: number | undefined) => void }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium"><span>{m.emoji}</span> {m.label} {m.unit && <span className="text-xs text-muted-foreground">({m.unit})</span>}</div>
      {m.kind === 'scale' ? (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => onChange(value === n ? undefined : n)} className={`h-8 flex-1 rounded-lg text-xs font-semibold ${value === n ? 'text-white' : 'bg-muted text-muted-foreground'}`} style={value === n ? { backgroundColor: accent } : undefined}>{n}</button>
          ))}
        </div>
      ) : m.kind === 'count' ? (
        <div className="flex items-center justify-between">
          <button onClick={() => onChange(Math.max(0, (value || 0) - 1))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"><Minus className="h-4 w-4" /></button>
          <span className="font-display text-lg font-bold">{value || 0}</span>
          <button onClick={() => onChange((value || 0) + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ backgroundColor: accent }}><Plus className="h-4 w-4" /></button>
        </div>
      ) : (
        <input type="number" step={m.step} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} placeholder="—" className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:outline-none" />
      )}
    </div>
  );
}

function MicroInsight({ agent, logs, habits }: { agent: YucaAgent; logs: DayLog[]; habits: Habit[] }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true); setError(null);
    const recent = [...logs].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 7);
    const summary = recent.map((l) => `${l.date}: ${METRICS.filter((m) => (l as any)[m.key] != null).map((m) => `${m.label} ${(l as any)[m.key]}${m.unit || ''}`).join(', ') || 'sin datos'}`).join('\n');
    const habitsLine = habits.map((h) => `${h.name} (racha ${streakFor(h)}d)`).join(', ');
    const prompt =
      `Eres Yuca, coach de bienestar con inteligencia emocional (modelo Six Seconds: Reconocer, Comprender, Elegir). ` +
      `Cálido, empático y muy breve.\nDatos recientes de la persona:\n${summary || 'aún sin registros'}\nHábitos: ${habitsLine || 'ninguno'}.\n` +
      `Dame UN micro-insight (máx 3 frases) y UNA micro-acción concreta para hoy. Sin diagnósticos médicos. Tono cercano.`;
    try {
      const res = await fetch('/api/cactus/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: agent.slug, messages: [{ role: 'user', content: prompt }], maxTokens: 400 }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setText(String(data.content || '').trim());
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoading(false); }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center gap-2"><Lightbulb className="h-4 w-4" style={{ color: agent.color }} /><h3 className="font-display font-semibold">Micro-insight</h3></div>
      {text ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{text}</p> : <p className="text-sm text-muted-foreground">Yuca mira tus señales y hábitos recientes y te da un empujón personalizado.</p>}
      {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      <button onClick={generate} disabled={loading} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: agent.color }}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {text ? 'Otro insight' : 'Generar mi insight'}
      </button>
    </div>
  );
}

// ═══ PROGRESO (tendencias reales de lo registrado) ════════════════════════════
function Progreso({ logs, accent }: { logs: DayLog[]; accent: string }) {
  const sorted = [...logs].sort((a, b) => (a.date < b.date ? -1 : 1));
  if (sorted.length === 0) {
    return <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground"><LineChart className="mx-auto mb-2 h-7 w-7 opacity-50" /><p className="text-sm">Registra tus señales en “Hoy” y aquí verás tu evolución.</p></div>;
  }
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Trend title="Peso (kg)" data={sorted.map((l) => ({ date: l.date, v: l.weight }))} accent={accent} />
      <Trend title="Sueño (h)" data={sorted.map((l) => ({ date: l.date, v: l.sleep }))} accent={accent} />
      <BarsTrend title="Ánimo" data={sorted.map((l) => ({ date: l.date, v: l.mood }))} accent={accent} />
      <BarsTrend title="Energía" data={sorted.map((l) => ({ date: l.date, v: l.energy }))} accent={accent} />
    </div>
  );
}

function Trend({ title, data, accent }: { title: string; data: { date: string; v?: number }[]; accent: string }) {
  const pts = data.filter((d) => d.v != null) as { date: string; v: number }[];
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-3 font-display font-semibold">{title}</h3>
      {pts.length < 2 ? <p className="py-6 text-center text-xs text-muted-foreground">Necesitas al menos 2 registros.</p> : (
        <>
          <Sparkline pts={pts.map((p) => p.v)} accent={accent} />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>{pts[0].v}</span><span className="font-semibold text-foreground">{pts[pts.length - 1].v}</span></div>
        </>
      )}
    </div>
  );
}

function Sparkline({ pts, accent }: { pts: number[]; accent: string }) {
  const min = Math.min(...pts), max = Math.max(...pts), range = max - min || 1;
  const coords = pts.map((v, i) => `${(i / (pts.length - 1)) * 100},${40 - ((v - min) / range) * 36 - 2}`).join(' ');
  return (
    <svg viewBox="0 0 100 40" className="h-20 w-full" preserveAspectRatio="none">
      <polyline fill="none" stroke={accent} strokeWidth="1.5" points={coords} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function BarsTrend({ title, data, accent }: { title: string; data: { date: string; v?: number }[]; accent: string }) {
  const pts = data.filter((d) => d.v != null).slice(-10) as { date: string; v: number }[];
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-3 font-display font-semibold">{title}</h3>
      {pts.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">Sin registros.</p> : (
        <div className="flex h-20 items-end gap-1">
          {pts.map((p, i) => <div key={i} className="flex-1 rounded-t" style={{ height: `${(p.v / 5) * 100}%`, backgroundColor: accent, opacity: 0.4 + (p.v / 5) * 0.6 }} title={`${p.date}: ${p.v}`} />)}
        </div>
      )}
    </div>
  );
}

// ═══ RELACIONES (a quién cuidar / reconectar) ═════════════════════════════════
function Relaciones({ relations, setRelations, accent }: { relations: Relation[]; setRelations: React.Dispatch<React.SetStateAction<Relation[]>>; accent: string }) {
  const [name, setName] = useState('');
  const [bond, setBond] = useState('');
  const add = () => { if (!name.trim()) return; setRelations((r) => [{ id: uid(), name: name.trim(), bond: bond.trim() || 'Cercano', feeling: 3, last: todayKey(), note: '' }, ...r]); setName(''); setBond(''); };
  const update = (id: string, patch: Partial<Relation>) => setRelations((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const remove = (id: string) => setRelations((r) => r.filter((x) => x.id !== id));

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-display text-lg font-semibold">Agregar persona</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        <input value={bond} onChange={(e) => setBond(e.target.value)} placeholder="Vínculo (pareja, mamá, socio…)" className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        <button onClick={add} disabled={!name.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: accent }}><Plus className="h-4 w-4" /> Agregar</button>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Yuca te recuerda con quién no hablas hace tiempo, para cuidar lo que importa.</p>
      </div>

      <div>
        {relations.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card text-center text-muted-foreground"><Users className="h-7 w-7 opacity-50" /><p className="text-sm">Aún no agregas a nadie. Empieza por las personas que más te importan.</p></div>
        ) : (
          <div className="space-y-3">
            {[...relations].sort((a, b) => daysSince(b.last) - daysSince(a.last)).map((r) => {
              const d = daysSince(r.last);
              const stale = d >= 14;
              return (
                <div key={r.id} className={`rounded-2xl border bg-card p-4 ${stale ? 'border-amber-300' : 'border-border'}`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display font-bold text-white" style={{ backgroundColor: accent }}>{r.name.slice(0, 1).toUpperCase()}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{r.name} <span className="text-xs font-normal text-muted-foreground">· {r.bond}</span></div>
                      <div className={`inline-flex items-center gap-1 text-[11px] ${stale ? 'text-amber-600' : 'text-muted-foreground'}`}><CalendarClock className="h-3 w-3" /> {d === 0 ? 'Hablaron hoy' : `Hace ${d} día${d === 1 ? '' : 's'}`}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => update(r.id, { feeling: n })} className="text-sm" title={`Vínculo ${n}/5`} style={{ opacity: n <= r.feeling ? 1 : 0.25 }}>❤️</button>)}
                    </div>
                    <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input value={r.note} onChange={(e) => update(r.id, { note: e.target.value })} placeholder="Nota / próximo paso…" className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none" />
                    <button onClick={() => update(r.id, { last: todayKey() })} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted"><Check className="h-3.5 w-3.5" /> Reconecté</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ COACH (chat EQ) ══════════════════════════════════════════════════════════
function Coach({ agent }: { agent: YucaAgent }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => { try { const raw = localStorage.getItem(CHAT_KEY); if (raw) setMessages(JSON.parse(raw)); } catch { /* noop */ } loadedRef.current = true; }, []);
  useEffect(() => { if (loadedRef.current) { try { localStorage.setItem(CHAT_KEY, JSON.stringify(messages)); } catch { /* noop */ } } endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const SUGGEST = ['Me siento abrumad@ hoy', 'Ayúdame a poner una meta de la semana', 'No logro ser constante', '¿Cómo retomo una relación distante?'];

  async function send(text?: string) {
    const t = (text ?? input).trim();
    if (!t || loading) return;
    setError(null);
    const next = [...messages, { role: 'user' as const, content: t }];
    setMessages(next); setInput(''); setLoading(true);
    const framed = [
      { role: 'user' as const, content: 'Actúa como Yuca: coach de bienestar con inteligencia emocional (Six Seconds, KCG: Reconocer, Comprender, Elegir). Cálido, empático, breve y práctico. Sin diagnósticos médicos.' },
      { role: 'assistant' as const, content: 'Aquí estoy contigo. 🌱' },
      ...next,
    ];
    try {
      const res = await fetch('/api/cactus/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: agent.slug, messages: framed }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setMessages((m) => [...m, { role: 'assistant', content: data.content }]);
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoading(false); }
  }

  return (
    <div className="flex h-[560px] flex-col rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3"><MessageCircle className="h-4 w-4" style={{ color: agent.color }} /><h3 className="font-display font-semibold">Coach Yuca</h3><span className="text-xs text-muted-foreground">· inteligencia emocional</span></div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground">
            <p>Hola, soy Yuca. Cuéntame cómo te sientes o qué quieres lograr y lo vemos juntos, paso a paso.</p>
            <div className="mt-3 flex flex-wrap gap-2">{SUGGEST.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">{s}</button>)}</div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${m.role === 'user' ? 'text-white' : 'bg-muted text-foreground'}`} style={m.role === 'user' ? { backgroundColor: agent.color } : undefined}>{m.content}</div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="rounded-2xl bg-muted px-3.5 py-2"><Loader2 className="h-4 w-4 animate-spin" /></div></div>}
        {error && <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        <div ref={endRef} />
      </div>
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} placeholder="Escríbele a Yuca…" className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
          <button onClick={() => send()} disabled={loading || !input.trim()} className="flex h-9 w-9 items-center justify-center rounded-lg text-white disabled:opacity-50" style={{ backgroundColor: agent.color }}><Send className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
