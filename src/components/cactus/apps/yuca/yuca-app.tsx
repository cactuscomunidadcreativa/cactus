'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sun, LineChart, HeartPulse, Wind, MessageCircle, Plus, Trash2, Check, Loader2, Sparkles,
  Flame, Send, Minus, Salad, FileText, ShieldAlert, Upload, ScanLine,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { QuickActionsBar } from '@/components/cactus/app-shell/quick-actions-bar';
import { extractText } from '@/lib/cactus/doc-extract';
import { parseMarkers, type MarkerResult, type MarkerStatus } from '@/lib/cactus/health-markers';

interface YucaAgent { slug: string; name: string; role: string; color: string; image: string }

const todayKey = () => new Date().toISOString().slice(0, 10);
const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
const HEALTH_NOTE = 'Yuca te acompaña, no sustituye a un profesional de salud. Ante cualquier duda médica, consulta a tu doctor.';

// Señales personales del check-in
type MetricKind = 'scale' | 'number' | 'count';
const METRICS: { key: string; label: string; emoji: string; kind: MetricKind; step?: number; unit?: string }[] = [
  { key: 'weight', label: 'Peso', emoji: '⚖️', kind: 'number', step: 0.1, unit: 'kg' },
  { key: 'sleep', label: 'Sueño', emoji: '😴', kind: 'number', step: 0.5, unit: 'h' },
  { key: 'mood', label: 'Ánimo', emoji: '🙂', kind: 'scale' },
  { key: 'energy', label: 'Energía', emoji: '⚡', kind: 'scale' },
  { key: 'water', label: 'Agua', emoji: '💧', kind: 'count', unit: 'vasos' },
  { key: 'steps', label: 'Pasos', emoji: '👟', kind: 'number', step: 100 },
];

interface DayLog { date: string; weight?: number; sleep?: number; mood?: number; energy?: number; water?: number; steps?: number }
interface Habit { id: string; name: string; emoji: string; done: Record<string, boolean> }

const LOGS_KEY = 'cactus.yuca.logs.v1';
const HABITS_KEY = 'cactus.yuca.habits.v1';
const CHAT_KEY = 'cactus.yuca.chat.v1';

function useStored<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { try { const raw = localStorage.getItem(key); if (raw) setVal(JSON.parse(raw)); } catch { /* noop */ } setLoaded(true); }, [key]);
  useEffect(() => { if (loaded) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ } } }, [key, val, loaded]);
  return [val, setVal];
}

function streakFor(h: Habit): number {
  let s = 0;
  for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (h.done[d.toISOString().slice(0, 10)]) s++; else break; }
  return s;
}

type View = 'hoy' | 'progreso' | 'salud' | 'meditar' | 'espacio';

export function YucaApp({ agent, user, credits }: { agent: YucaAgent; user?: ShellUser; credits?: number }) {
  const [view, setView] = useState<View>('hoy');
  const [logs, setLogs] = useStored<DayLog[]>(LOGS_KEY, []);
  const [habits, setHabits] = useStored<Habit[]>(HABITS_KEY, [
    { id: uid(), name: 'Tomar agua', emoji: '💧', done: {} },
    { id: uid(), name: 'Moverme 30 min', emoji: '🏃', done: {} },
    { id: uid(), name: 'Meditar', emoji: '🧘', done: {} },
  ]);

  const today = todayKey();
  const todayLog = logs.find((l) => l.date === today) || { date: today };
  const setMetric = (key: string, value: number | undefined) =>
    setLogs((prev) => { const rest = prev.filter((l) => l.date !== today); return [...rest, { ...todayLog, [key]: value }]; });

  const lastWeight = [...logs].reverse().find((l) => l.weight != null)?.weight;
  const sleepVals = logs.map((l) => l.sleep).filter((v): v is number => v != null).slice(-7);
  const avgSleep = sleepVals.length ? (sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length).toFixed(1) : '—';

  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [
    { key: 'hoy', label: 'Hoy', icon: Sun },
    { key: 'progreso', label: 'Progreso', icon: LineChart },
    { key: 'salud', label: 'Salud', icon: HeartPulse },
    { key: 'meditar', label: 'Meditar', icon: Wind },
    { key: 'espacio', label: 'Mi espacio', icon: MessageCircle },
  ];
  const kpis: Kpi[] = [
    { label: 'Peso', value: lastWeight != null ? `${lastWeight} kg` : '—', icon: <HeartPulse className="h-4 w-4" /> },
    { label: 'Sueño prom.', value: avgSleep === '—' ? '—' : `${avgSleep} h`, icon: <Sun className="h-4 w-4" />, hint: 'últimos 7' },
    { label: 'Rutinas hoy', value: `${habits.filter((h) => h.done[today]).length}/${habits.length}`, icon: <Check className="h-4 w-4" /> },
    { label: 'Racha máx.', value: Math.max(0, ...habits.map(streakFor)), icon: <Flame className="h-4 w-4" />, hint: 'días' },
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
      subtitle="Tu espacio personal con Yuca"
    >
      <KpiRow items={kpis} accent={agent.color} />

      {view === 'hoy' && <Hoy agent={agent} todayLog={todayLog} setMetric={setMetric} habits={habits} setHabits={setHabits} today={today} />}
      {view === 'progreso' && <Progreso logs={logs} accent={agent.color} />}
      {view === 'salud' && <Salud agent={agent} lastWeight={lastWeight} />}
      {view === 'meditar' && <Meditar agent={agent} />}
      {view === 'espacio' && <Espacio agent={agent} />}

      <QuickActionsBar
        accent={agent.color}
        actions={[
          { label: 'Check-in de hoy', icon: Sun, onClick: () => setView('hoy') },
          { label: 'Mi progreso', icon: LineChart, onClick: () => setView('progreso') },
          { label: 'Salud & dieta', icon: Salad, onClick: () => setView('salud') },
          { label: 'Respirar', icon: Wind, onClick: () => setView('meditar') },
        ]}
      />
    </AgentAppShell>
  );
}

// ═══ HOY (check-in + rutinas) ═════════════════════════════════════════════════
function Hoy({
  agent, todayLog, setMetric, habits, setHabits, today,
}: {
  agent: YucaAgent; todayLog: DayLog; setMetric: (k: string, v: number | undefined) => void;
  habits: Habit[]; setHabits: React.Dispatch<React.SetStateAction<Habit[]>>; today: string;
}) {
  const [newHabit, setNewHabit] = useState('');
  const c = agent.color;
  const toggleHabit = (id: string) => setHabits((p) => p.map((h) => (h.id === id ? { ...h, done: { ...h.done, [today]: !h.done[today] } } : h)));
  const addHabit = (n: string) => setHabits((p) => [...p, { id: uid(), name: n, emoji: '✨', done: {} }]);
  const delHabit = (id: string) => setHabits((p) => p.filter((h) => h.id !== id));

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-1 font-display text-lg font-semibold">¿Cómo vienes hoy?</h3>
        <p className="mb-4 text-sm text-muted-foreground">Registra tus señales. Este es tu espacio, a tu ritmo.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {METRICS.map((m) => <MetricInput key={m.key} m={m} value={(todayLog as any)[m.key]} accent={c} onChange={(v) => setMetric(m.key, v)} />)}
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-display font-semibold">Rutinas</h3>
          <div className="space-y-2">
            {habits.map((h) => {
              const done = !!h.done[today]; const streak = streakFor(h);
              return (
                <div key={h.id} className="flex items-center gap-2.5 rounded-xl border border-border bg-background p-2.5">
                  <button onClick={() => toggleHabit(h.id)} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${done ? 'text-white' : 'border-border text-transparent'}`} style={done ? { backgroundColor: c, borderColor: c } : undefined}><Check className="h-3.5 w-3.5" /></button>
                  <span className="text-base">{h.emoji}</span>
                  <span className="flex-1 text-sm">{h.name}</span>
                  {streak > 0 && <span className="inline-flex items-center gap-0.5 text-xs text-amber-600"><Flame className="h-3 w-3" /> {streak}</span>}
                  <button onClick={() => delHabit(h.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input value={newHabit} onChange={(e) => setNewHabit(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newHabit.trim()) { addHabit(newHabit.trim()); setNewHabit(''); } }} placeholder="Nueva rutina…" className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none" />
            <button onClick={() => { if (newHabit.trim()) { addHabit(newHabit.trim()); setNewHabit(''); } }} className="inline-flex items-center rounded-lg px-2 py-1.5 text-white" style={{ backgroundColor: c }}><Plus className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-[11px] leading-relaxed text-muted-foreground">{HEALTH_NOTE}</p>
      </aside>
    </div>
  );
}

function MetricInput({ m, value, accent, onChange }: { m: typeof METRICS[number]; value?: number; accent: string; onChange: (v: number | undefined) => void }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium"><span>{m.emoji}</span> {m.label} {m.unit && <span className="text-xs text-muted-foreground">({m.unit})</span>}</div>
      {m.kind === 'scale' ? (
        <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => onChange(value === n ? undefined : n)} className={`h-8 flex-1 rounded-lg text-xs font-semibold ${value === n ? 'text-white' : 'bg-muted text-muted-foreground'}`} style={value === n ? { backgroundColor: accent } : undefined}>{n}</button>)}</div>
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

// ═══ PROGRESO ═════════════════════════════════════════════════════════════════
function Progreso({ logs, accent }: { logs: DayLog[]; accent: string }) {
  const sorted = [...logs].sort((a, b) => (a.date < b.date ? -1 : 1));
  if (sorted.length === 0) return <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground"><LineChart className="mx-auto mb-2 h-7 w-7 opacity-50" /><p className="text-sm">Registra tus señales en “Hoy” y aquí verás cómo vas.</p></div>;
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Trend title="Peso (kg)" data={sorted.map((l) => ({ v: l.weight }))} accent={accent} />
      <Trend title="Sueño (h)" data={sorted.map((l) => ({ v: l.sleep }))} accent={accent} />
      <BarsTrend title="Ánimo" data={sorted.map((l) => ({ v: l.mood }))} accent={accent} />
      <BarsTrend title="Energía" data={sorted.map((l) => ({ v: l.energy }))} accent={accent} />
    </div>
  );
}

function Trend({ title, data, accent }: { title: string; data: { v?: number }[]; accent: string }) {
  const pts = data.map((d) => d.v).filter((v): v is number => v != null);
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-3 font-display font-semibold">{title}</h3>
      {pts.length < 2 ? <p className="py-6 text-center text-xs text-muted-foreground">Necesitas al menos 2 registros.</p> : (
        <>
          <Sparkline pts={pts} accent={accent} />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>{pts[0]}</span><span className="font-semibold text-foreground">{pts[pts.length - 1]}</span></div>
        </>
      )}
    </div>
  );
}

function Sparkline({ pts, accent }: { pts: number[]; accent: string }) {
  const min = Math.min(...pts), max = Math.max(...pts), range = max - min || 1;
  const coords = pts.map((v, i) => `${(i / (pts.length - 1)) * 100},${40 - ((v - min) / range) * 36 - 2}`).join(' ');
  return <svg viewBox="0 0 100 40" className="h-20 w-full" preserveAspectRatio="none"><polyline fill="none" stroke={accent} strokeWidth="1.5" points={coords} vectorEffect="non-scaling-stroke" /></svg>;
}

function BarsTrend({ title, data, accent }: { title: string; data: { v?: number }[]; accent: string }) {
  const pts = data.map((d) => d.v).filter((v): v is number => v != null).slice(-12);
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-3 font-display font-semibold">{title}</h3>
      {pts.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">Sin registros.</p> : (
        <div className="flex h-20 items-end gap-1">{pts.map((v, i) => <div key={i} className="flex-1 rounded-t" style={{ height: `${(v / 5) * 100}%`, backgroundColor: accent, opacity: 0.4 + (v / 5) * 0.6 }} title={`${v}`} />)}</div>
      )}
    </div>
  );
}

// ═══ SALUD (interpretar análisis + generar dieta) ═════════════════════════════
function Salud({ agent, lastWeight }: { agent: YucaAgent; lastWeight?: number }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Analisis agent={agent} />
      <Dieta agent={agent} lastWeight={lastWeight} />
    </div>
  );
}

const STATUS_UI: Record<MarkerStatus, { label: string; cls: string }> = {
  normal: { label: 'Normal', cls: 'bg-emerald-100 text-emerald-700' },
  limite: { label: 'Límite', cls: 'bg-amber-100 text-amber-700' },
  bajo: { label: 'Bajo', cls: 'bg-sky-100 text-sky-700' },
  alto: { label: 'Alto', cls: 'bg-red-100 text-red-700' },
};

function Analisis({ agent }: { agent: YucaAgent }) {
  const [text, setText] = useState('');
  const [markers, setMarkers] = useState<MarkerResult[] | null>(null);
  const [reading, setReading] = useState(false);   // OCR/extracción
  const [out, setOut] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const c = agent.color;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setReading(true); setError(null); setOut(null);
    try {
      const txt = await extractText(f);
      if (!txt) throw new Error('No pude leer texto del archivo. Prueba con otra imagen más nítida o pega los valores.');
      setText(txt);
      setMarkers(parseMarkers(txt));
    } catch (err: any) {
      setError(err?.message || 'No pude leer el archivo. Pega los valores manualmente.');
    } finally { setReading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  function readValues() { setMarkers(parseMarkers(text)); }

  async function explainAI() {
    if (!text.trim() || loadingAI) return;
    setLoadingAI(true); setError(null); setOut(null);
    const prompt = `Eres Yuca, asistente personal de salud (no médico). La persona comparte resultados de su análisis:\n"""${text.trim().slice(0, 4000)}"""\nExplica en lenguaje claro y cercano qué significan los valores principales, qué está bien y a qué poner atención, y 3 hábitos concretos que ayudarían. Prudente, sin diagnosticar ni alarmar. Cierra recordando consultar a su médico.`;
    try {
      const res = await fetch('/api/cactus/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: agent.slug, messages: [{ role: 'user', content: prompt }], maxTokens: 1200 }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setOut(String(data.content || '').trim());
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoadingAI(false); }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center gap-2"><FileText className="h-4 w-4" style={{ color: c }} /><h3 className="font-display font-semibold">Tus análisis</h3></div>
      <p className="mb-3 text-sm text-muted-foreground">Sube tu análisis (PDF o foto) o pega los valores. Yuca los lee y te dice cómo vas — la lectura es <strong>gratis</strong>, sin IA.</p>

      <div className="mb-2 flex flex-wrap gap-2">
        <button onClick={() => fileRef.current?.click()} disabled={reading} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: c }}>
          {reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {reading ? 'Leyendo…' : 'Subir análisis'}
        </button>
        <button onClick={readValues} disabled={!text.trim()} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"><ScanLine className="h-4 w-4" /> Leer valores</button>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={onFile} />
      </div>

      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="…o pega aquí: Glucosa 95, colesterol total 210, HDL 45, triglicéridos 180, presión 120/80, vitamina D 22…" className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
      {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      {markers && (
        markers.length === 0 ? (
          <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">No reconocí valores estándar. Revisa el texto o pídele a Yuca una explicación con IA.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50 text-left text-[11px] text-muted-foreground"><th className="px-3 py-2 font-medium">Marcador</th><th className="px-2 py-2 font-medium">Tu valor</th><th className="px-2 py-2 font-medium">Referencia</th><th className="px-3 py-2 font-medium">Estado</th></tr></thead>
              <tbody>
                {markers.map((m, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2"><div className="font-medium">{m.label}</div><div className="text-[11px] text-muted-foreground">{m.note}</div></td>
                    <td className="px-2 py-2 font-semibold">{m.raw} <span className="text-[10px] font-normal text-muted-foreground">{m.unit}</span></td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">{m.ref}</td>
                    <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_UI[m.status].cls}`}>{STATUS_UI[m.status].label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <button onClick={explainAI} disabled={loadingAI || !text.trim()} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">{loadingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" style={{ color: c }} />} Explicación con IA (opcional)</button>
      {out && <div className="mt-3 whitespace-pre-wrap rounded-xl border border-border bg-background p-3 text-sm leading-relaxed text-foreground/85">{out}</div>}
      <p className="mt-3 inline-flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-700"><ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {HEALTH_NOTE}</p>
    </div>
  );
}

function Dieta({ agent, lastWeight }: { agent: YucaAgent; lastWeight?: number }) {
  const [goal, setGoal] = useState('Mantenerme saludable');
  const [restr, setRestr] = useState('');
  const [meals, setMeals] = useState('3');
  const [out, setOut] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const c = agent.color;

  async function make() {
    if (loading) return;
    setLoading(true); setError(null); setOut(null);
    const prompt = `Eres Yuca, asistente personal de bienestar (no médico ni nutriólogo). Crea un plan de alimentación de un día, equilibrado y realista.\nObjetivo: ${goal}.\nComidas al día: ${meals}.\nRestricciones/preferencias: ${restr.trim() || 'ninguna'}.${lastWeight ? ` Peso actual aprox: ${lastWeight} kg.` : ''}\nDa opciones concretas por comida con porciones aproximadas y 2 snacks. Práctico y accesible. Cierra recordando que un nutriólogo puede personalizarlo.`;
    try {
      const res = await fetch('/api/cactus/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: agent.slug, messages: [{ role: 'user', content: prompt }], maxTokens: 1400 }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setOut(String(data.content || '').trim());
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoading(false); }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center gap-2"><Salad className="h-4 w-4" style={{ color: c }} /><h3 className="font-display font-semibold">Genera tu dieta</h3></div>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <select value={goal} onChange={(e) => setGoal(e.target.value)} className="rounded-lg border border-border bg-background px-2.5 py-2 text-sm focus:outline-none">
          {['Mantenerme saludable', 'Bajar de peso', 'Ganar masa muscular', 'Más energía', 'Comer más balanceado'].map((g) => <option key={g}>{g}</option>)}
        </select>
        <select value={meals} onChange={(e) => setMeals(e.target.value)} className="rounded-lg border border-border bg-background px-2.5 py-2 text-sm focus:outline-none">
          {['2', '3', '4', '5'].map((m) => <option key={m} value={m}>{m} comidas</option>)}
        </select>
      </div>
      <input value={restr} onChange={(e) => setRestr(e.target.value)} placeholder="Restricciones: vegetariano, sin gluten, alergias…" className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
      <button onClick={make} disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: c }}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Salad className="h-4 w-4" />} Generar plan</button>
      {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      {out && <div className="mt-3 whitespace-pre-wrap rounded-xl border border-border bg-background p-3 text-sm leading-relaxed text-foreground/85">{out}</div>}
    </div>
  );
}

// ═══ MEDITAR (respiración + meditación guiada) ════════════════════════════════
function Meditar({ agent }: { agent: YucaAgent }) {
  const [breathing, setBreathing] = useState(false);
  const [theme, setTheme] = useState('Calmar el estrés');
  const [script, setScript] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const c = agent.color;

  async function guided() {
    if (loading) return;
    setLoading(true); setError(null); setScript(null);
    const prompt = `Eres Yuca. Escribe una meditación guiada breve (2-3 minutos al leerla con calma) para: "${theme}". Tono cálido y sereno, en segunda persona. Incluye indicaciones de respiración. Sin introducción ni títulos.`;
    try {
      const res = await fetch('/api/cactus/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: agent.slug, messages: [{ role: 'user', content: prompt }], maxTokens: 800 }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setScript(String(data.content || '').trim());
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoading(false); }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8">
        <h3 className="mb-1 font-display text-lg font-semibold">Respira</h3>
        <p className="mb-6 text-sm text-muted-foreground">Sigue el círculo: inhala al crecer, exhala al encoger.</p>
        <div className="relative flex h-52 w-52 items-center justify-center">
          <motion.div
            className="absolute h-40 w-40 rounded-full"
            style={{ backgroundColor: c, opacity: 0.18 }}
            animate={breathing ? { scale: [1, 1.5, 1.5, 1] } : { scale: 1 }}
            transition={breathing ? { duration: 11, times: [0, 0.36, 0.72, 1], repeat: Infinity, ease: 'easeInOut' } : { duration: 0.6 }}
          />
          <motion.div
            className="flex h-28 w-28 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: c }}
            animate={breathing ? { scale: [1, 1.35, 1.35, 1] } : { scale: 1 }}
            transition={breathing ? { duration: 11, times: [0, 0.36, 0.72, 1], repeat: Infinity, ease: 'easeInOut' } : { duration: 0.6 }}
          >
            <Wind className="h-8 w-8" />
          </motion.div>
        </div>
        <button onClick={() => setBreathing((b) => !b)} className="mt-6 rounded-lg px-5 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: c }}>{breathing ? 'Detener' : 'Empezar (4-3-4)'}</button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4" style={{ color: c }} /><h3 className="font-display font-semibold">Meditación guiada</h3></div>
        <select value={theme} onChange={(e) => setTheme(e.target.value)} className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none">
          {['Calmar el estrés', 'Conciliar el sueño', 'Enfoque y claridad', 'Gratitud', 'Soltar la ansiedad'].map((th) => <option key={th}>{th}</option>)}
        </select>
        <button onClick={guided} disabled={loading} className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: c }}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wind className="h-4 w-4" />} Generar meditación</button>
        {error && <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        {script ? <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{script}</div> : <p className="text-sm text-muted-foreground">Elige un tema y Yuca te escribe una meditación para acompañarte.</p>}
      </div>
    </div>
  );
}

// ═══ MI ESPACIO (conversar — acompañamiento personal) ═════════════════════════
function Espacio({ agent }: { agent: YucaAgent }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => { try { const raw = localStorage.getItem(CHAT_KEY); if (raw) setMessages(JSON.parse(raw)); } catch { /* noop */ } loadedRef.current = true; }, []);
  useEffect(() => { if (loadedRef.current) { try { localStorage.setItem(CHAT_KEY, JSON.stringify(messages)); } catch { /* noop */ } } endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const SUGGEST = ['Hoy me costó el día', 'Quiero crear un buen hábito', 'Ayúdame a dormir mejor', 'Necesito desahogarme un momento'];

  async function send(text?: string) {
    const t = (text ?? input).trim();
    if (!t || loading) return;
    setError(null);
    const next = [...messages, { role: 'user' as const, content: t }];
    setMessages(next); setInput(''); setLoading(true);
    const framed = [
      { role: 'user' as const, content: 'Actúa como Yuca: un espacio personal, cercano y seguro para conversar sobre el día, hábitos, sueño y bienestar general. Cálido, sin juzgar, práctico y breve. No das diagnósticos médicos; ante temas serios sugieres con cuidado buscar apoyo profesional.' },
      { role: 'assistant' as const, content: 'Aquí estoy, este es tu espacio. 🌱' },
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
      <div className="flex items-center gap-2 border-b border-border px-4 py-3"><MessageCircle className="h-4 w-4" style={{ color: agent.color }} /><h3 className="font-display font-semibold">Mi espacio</h3><span className="text-xs text-muted-foreground">· conversa con Yuca</span></div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground">
            <p>Este es tu espacio seguro. Cuéntame cómo va tu día o en qué quieres trabajar; aquí no se juzga.</p>
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
