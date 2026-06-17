'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Send, Check, MessageSquare, ListTodo, FolderKanban, CalendarDays, Activity,
  Loader2, Plus, Sparkles, Inbox, Circle, Play, ShieldAlert,
} from 'lucide-react';
import { getAgent } from '@/lib/cactus/agents-catalog';
import { taskProgress, type OrchestratorTask, type OrchestratorDeliverable } from '@/lib/cactus/orchestrator';
import { sensitiveReason } from '@/lib/cactus/orchestrator-exec';
import type { RamonaPlan } from '@/lib/cactus/ramona';
import { useOrchestrator, type BlockedInfo } from './use-orchestrator';

const RAMONA_COLOR = '#A855C7';
const RAMONA_IMG = '/agents/ramona.png';

const FUNCIONES = ['Responde al instante', 'Organiza y coordina', 'Gestiona proyectos', 'Asegura y protege', '24/7 contigo'];
const QUICK = [
  'Quiero lanzar un nuevo producto',
  'Crear una campaña en redes',
  'Analizar a mi competencia',
  'Organizar las tareas de mi equipo',
];

const TABS = [
  { key: 'conversacion', label: 'Conversación', icon: MessageSquare },
  { key: 'tareas', label: 'Tareas', icon: ListTodo },
  { key: 'proyectos', label: 'Proyectos', icon: FolderKanban },
  { key: 'agenda', label: 'Agenda', icon: CalendarDays },
  { key: 'actividad', label: 'Actividad', icon: Activity },
] as const;

const TASK_BADGE: Record<OrchestratorTask['status'], { label: string; cls: string }> = {
  pending: { label: 'Pendiente', cls: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'En progreso', cls: 'bg-cactus-green/15 text-cactus-green' },
  review: { label: 'En revisión', cls: 'bg-amber-100 text-amber-700' },
  done: { label: 'Completada', cls: 'bg-emerald-100 text-emerald-700' },
};

export function RamonaWorkspace() {
  const { state, loading, sending, executing, error, blocked, send, approve } = useOrchestrator();
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('conversacion');
  const [input, setInput] = useState('');

  const busy = sending || executing;
  const submit = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput('');
    send(msg);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_1fr_330px]">
      {/* ── Columna izquierda: Hero de Ramona ── */}
      <Hero stats={state.stats} />

      {/* ── Centro: tabs + contenido ── */}
      <div className="min-w-0 rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-2 py-1.5">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? 'bg-cactus-green/10 text-cactus-green' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {tab === 'conversacion' && (
            <Conversation
              messages={state.messages}
              loading={loading}
              sending={sending}
              executing={executing}
              error={error}
              blocked={blocked}
              busy={busy}
              input={input}
              setInput={setInput}
              onSubmit={submit}
            />
          )}
          {tab === 'tareas' && <TasksTab tasks={state.tasks} onApprove={approve} busy={busy} />}
          {tab !== 'conversacion' && tab !== 'tareas' && <Placeholder tab={tab} />}
        </div>
      </div>

      {/* ── Columna derecha: Entregables + Agentes activos ── */}
      <div className="space-y-5">
        <Deliverables items={state.deliverables} />
        <ActiveAgents tasks={state.tasks} onApprove={approve} busy={busy} />
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────
function Hero({ stats }: { stats: { projects: number; tasks: number; agents: number } }) {
  return (
    <aside className="rounded-2xl border border-border bg-card p-5">
      <div className="group flex flex-col items-center text-center">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> En línea
        </span>
        <Image
          src={RAMONA_IMG}
          alt="Ramona"
          width={132}
          height={132}
          className="rounded-2xl motion-safe:animate-cactus-float motion-safe:group-hover:animate-cactus-wiggle"
        />
        <h2 className="mt-3 font-display text-2xl font-bold">Ramona</h2>
        <p className="text-sm font-medium" style={{ color: RAMONA_COLOR }}>Coordinadora General</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Tu asistente personal IA. Responde, organiza, coordina y asegura que todo se ejecute.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Stat n={stats.tasks} label="Tareas hoy" />
        <Stat n={stats.projects} label="Proyectos" />
        <Stat n={stats.agents} label="Agentes" />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Funciones principales</p>
        <ul className="space-y-1.5">
          {FUNCIONES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cactus-green/15">
                <Check className="h-3 w-3 text-cactus-green" />
              </span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-background py-2.5">
      <div className="font-display text-xl font-bold">{n}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

// ── Conversación ────────────────────────────────────────────────────────────
function Conversation({
  messages, loading, sending, executing, error, blocked, busy, input, setInput, onSubmit,
}: {
  messages: { id: string; role: string; content: string; plan: RamonaPlan | null }[];
  loading: boolean; sending: boolean; executing: boolean; error: string | null;
  blocked: BlockedInfo | null; busy: boolean;
  input: string; setInput: (v: string) => void; onSubmit: (text?: string) => void;
}) {
  const empty = !loading && messages.length === 0 && !blocked;

  return (
    <div className="flex h-[calc(100vh-19rem)] min-h-[420px] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {loading && (
          <div className="flex justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        )}

        {empty && (
          <div className="pt-2">
            <div className="flex items-start gap-3">
              <Image src={RAMONA_IMG} alt="Ramona" width={36} height={36} className="rounded-full" />
              <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm">
                ¡Hola! 👋 ¿En qué puedo ayudarte hoy? Dime tu objetivo y armo el equipo.
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 pl-12">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => onSubmit(q)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-cactus-green hover:text-cactus-green disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" /> {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id}>
            {m.role === 'user' ? (
              <div className="flex justify-end">
                <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-cactus-green px-4 py-2.5 text-sm text-white">
                  {m.content}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Image src={RAMONA_IMG} alt="Ramona" width={36} height={36} className="rounded-full" />
                <div className="min-w-0 max-w-[85%] space-y-2">
                  <div className="whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm">{m.content}</div>
                  {m.plan && <PlanCard plan={m.plan} />}
                </div>
              </div>
            )}
          </div>
        ))}

        {(sending || executing) && (
          <div className="flex items-start gap-3">
            <Image src={RAMONA_IMG} alt="Ramona" width={36} height={36} className="rounded-full" />
            <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {executing ? 'Coordinando al equipo…' : 'Pensando…'}
            </div>
          </div>
        )}

        {blocked && (
          <div className="flex items-start gap-3">
            <Image src={RAMONA_IMG} alt="Ramona" width={36} height={36} className="rounded-full" />
            <div className="max-w-[85%] space-y-2 rounded-2xl rounded-tl-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p>{blocked.reply}</p>
              <Link href={blocked.href} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600">
                <Sparkles className="h-3.5 w-3.5" /> Renovar plan
              </Link>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex items-end gap-2 border-t border-border pt-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
          rows={1}
          placeholder="Escribe tu solicitud a Ramona…"
          className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-cactus-green focus:outline-none"
        />
        <button
          onClick={() => onSubmit()}
          disabled={busy || !input.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white disabled:opacity-50"
          style={{ backgroundColor: RAMONA_COLOR }}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function PlanCard({ plan }: { plan: RamonaPlan }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plan · {plan.intent}</p>
      <ol className="space-y-2">
        {plan.steps.map((s, i) => {
          const a = getAgent(s.agentSlug);
          return (
            <li key={i} className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: s.color }}>{i + 1}</span>
              {a && <Image src={a.image} alt={s.agentName} width={22} height={22} className="rounded-md" />}
              <span className="min-w-0 flex-1">
                <span className="text-sm font-medium">{s.agentName}</span>
                <span className="block truncate text-xs text-muted-foreground">{s.action}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Tareas ──────────────────────────────────────────────────────────────────
function TasksTab({ tasks, onApprove, busy }: { tasks: OrchestratorTask[]; onApprove: (id: string) => void; busy: boolean }) {
  if (!tasks.length) {
    return <EmptyState icon={ListTodo} text="Aún no hay tareas. Dile un objetivo a Ramona en la Conversación y armará el plan." />;
  }
  return (
    <div className="space-y-2">
      {tasks.map((t) => {
        const a = getAgent(t.agent_slug);
        const badge = TASK_BADGE[t.status];
        const review = t.status === 'review';
        return (
          <div key={t.id} className={`rounded-xl border bg-background p-3 ${review ? 'border-amber-300' : 'border-border'}`}>
            <div className="flex items-center gap-3">
              {a && <Image src={a.image} alt={a.name} width={32} height={32} className="rounded-lg" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.action}</p>
                <p className="text-xs text-muted-foreground">{a?.name || t.agent_slug} · {a?.role}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
            </div>
            {review && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-amber-50 px-2.5 py-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-800">
                  <ShieldAlert className="h-3.5 w-3.5" /> {sensitiveReason(t.agent_slug, t.action)} · necesita tu OK
                </span>
                <button
                  onClick={() => onApprove(t.id)}
                  disabled={busy}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  <Play className="h-3 w-3" /> Aprobar y ejecutar
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Placeholder({ tab }: { tab: string }) {
  const labels: Record<string, string> = {
    proyectos: 'Gestión de proyectos', agenda: 'Agenda', actividad: 'Actividad', contexto: 'Contexto',
  };
  return <EmptyState icon={Sparkles} text={`${labels[tab] || tab} — próximamente en esta vista.`} />;
}

function EmptyState({ icon: Icon, text }: { icon: typeof ListTodo; text: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
      <Icon className="h-7 w-7 opacity-50" />
      <p className="max-w-xs text-sm">{text}</p>
    </div>
  );
}

// ── Panel derecho: Entregables ──────────────────────────────────────────────
function Deliverables({ items }: { items: OrchestratorDeliverable[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display font-semibold">Entregables</h3>
        <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <Plus className="h-3.5 w-3.5" /> Nuevo
        </button>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
          <Inbox className="h-6 w-6 opacity-50" />
          <p className="text-xs">Aún no hay entregables. Ramona los irá generando con el equipo.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((d) => (
            <li key={d.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-background p-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cactus-green/10 text-xs font-semibold uppercase text-cactus-green">{d.kind.slice(0, 3)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{d.title}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{getAgent(d.agent_slug || '')?.name || d.agent_slug}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Panel derecho: Agentes activos ──────────────────────────────────────────
function ActiveAgents({ tasks, onApprove, busy }: { tasks: OrchestratorTask[]; onApprove: (id: string) => void; busy: boolean }) {
  const active = tasks.filter((t) => t.status !== 'done');
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-3 font-display font-semibold">Agentes activos</h3>
      {active.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
          <Circle className="h-5 w-5 opacity-50" />
          <p className="text-xs">Sin agentes trabajando todavía.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {active.map((t) => {
            const a = getAgent(t.agent_slug);
            const pct = taskProgress(t);
            const review = t.status === 'review';
            return (
              <li key={t.id} className="flex items-center gap-3">
                {a && <Image src={a.image} alt={a.name} width={32} height={32} className="rounded-lg" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium">{a?.name || t.agent_slug}</span>
                    {review ? (
                      <button
                        onClick={() => onApprove(t.id)}
                        disabled={busy}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                      >
                        <Play className="h-2.5 w-2.5" /> Aprobar
                      </button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">{pct}%</span>
                    )}
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: review ? '#F59E0B' : (a?.color || RAMONA_COLOR) }} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
