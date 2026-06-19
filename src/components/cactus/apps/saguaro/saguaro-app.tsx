'use client';

import { useEffect, useMemo, useState } from 'react';
import { Markdown } from '@/components/cactus/shared/markdown';
import {
  LayoutDashboard, Workflow, Zap, CheckSquare, LayoutTemplate, Wand2, Loader2,
  Plus, Play, Pause, Trash2, Check, X, ChevronDown, Clock, GitBranch, Users,
  CircleDot, Sparkles, ListChecks,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { QuickActionsBar } from '@/components/cactus/app-shell/quick-actions-bar';
import { useAutomations, AutomationsPanel } from '@/components/cactus/apps/shared/automations';

interface SaguaroAgent { slug: string; name: string; role: string; color: string; image: string }

// ── Modelo de datos (BPM) ─────────────────────────────────────────────────────
type StepStatus = 'pendiente' | 'en_curso' | 'hecho' | 'bloqueado';
const STEP_LABEL: Record<StepStatus, string> = {
  pendiente: 'Pendiente', en_curso: 'En curso', hecho: 'Hecho', bloqueado: 'Requiere aprobación',
};
const STEP_COLOR: Record<StepStatus, string> = {
  pendiente: '#94a3b8', en_curso: '#3b82f6', hecho: '#22c55e', bloqueado: '#f59e0b',
};

interface FlowStep { id: string; name: string; role: string; status: StepStatus; needsApproval?: boolean }
type FlowStatus = 'borrador' | 'activo' | 'pausado' | 'completado';
interface Flow { id: string; name: string; area: string; status: FlowStatus; steps: FlowStep[]; createdAt: number }

const STORAGE_KEY = 'cactus.saguaro.flows.v1';
const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

const TEMPLATES: { name: string; area: string; steps: { name: string; role: string; approval?: boolean }[] }[] = [
  { name: 'Onboarding de cliente', area: 'Operaciones', steps: [
    { name: 'Recibir alta', role: 'Ventas' }, { name: 'Crear cuenta', role: 'Operaciones' },
    { name: 'Kickoff', role: 'Cuenta' }, { name: 'Aprobación de contrato', role: 'Dirección', approval: true },
  ] },
  { name: 'Producción de contenido', area: 'Marketing', steps: [
    { name: 'Brief', role: 'Estrategia' }, { name: 'Redacción', role: 'Contenido' },
    { name: 'Diseño', role: 'Creativo' }, { name: 'Revisión', role: 'Dirección', approval: true }, { name: 'Publicación', role: 'Social' },
  ] },
  { name: 'Proceso comercial', area: 'Ventas', steps: [
    { name: 'Lead entrante', role: 'SDR' }, { name: 'Calificación', role: 'Ventas' },
    { name: 'Propuesta', role: 'Ventas' }, { name: 'Cierre', role: 'Dirección', approval: true },
  ] },
  { name: 'Soporte y postventa', area: 'Soporte', steps: [
    { name: 'Ticket abierto', role: 'Soporte' }, { name: 'Diagnóstico', role: 'Soporte' },
    { name: 'Resolución', role: 'Soporte' }, { name: 'Encuesta NPS', role: 'Cuenta' },
  ] },
];

function flowFromTemplate(t: (typeof TEMPLATES)[number]): Flow {
  return {
    id: uid(), name: t.name, area: t.area, status: 'activo', createdAt: Date.now(),
    steps: t.steps.map((s, i) => ({
      id: uid(), name: s.name, role: s.role,
      status: i === 0 ? 'en_curso' : 'pendiente', needsApproval: s.approval,
    })),
  };
}

// ── Automatizaciones por defecto (Bloque 7) ──────────────────────────────────
const DEFAULT_AUTOMATIONS = [
  { id: 'auto-advance', name: 'Avance automático de pasos', desc: 'Al marcar un paso como hecho, activa el siguiente.', trigger: 'Paso completado', enabled: true },
  { id: 'approval-alert', name: 'Alertar aprobaciones', desc: 'Avisa a Ramona cuando un paso requiere aprobación.', trigger: 'Paso bloqueado', enabled: true },
  { id: 'stale-nudge', name: 'Recordatorio de flujos detenidos', desc: 'Empuja flujos sin avance en 48 h.', trigger: 'Inactividad 48h', enabled: false },
  { id: 'autoclose', name: 'Cierre automático', desc: 'Marca el flujo como completado cuando todos los pasos están hechos.', trigger: 'Todos los pasos hechos', enabled: true },
];

type View = 'resumen' | 'flujos' | 'automatizaciones' | 'aprobaciones' | 'plantillas' | 'generar';

export function SaguaroApp({ agent, user, credits }: { agent: SaguaroAgent; user?: ShellUser; credits?: number }) {
  const [view, setView] = useState<View>('resumen');
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const autos = useAutomations('saguaro', DEFAULT_AUTOMATIONS);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setFlows(JSON.parse(raw)); } catch { /* noop */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(flows)); } catch { /* noop */ }
  }, [flows, loaded]);

  const add = (f: Flow) => setFlows((p) => [f, ...p]);
  const remove = (id: string) => setFlows((p) => p.filter((x) => x.id !== id));
  const update = (id: string, fn: (f: Flow) => Flow) => setFlows((p) => p.map((x) => (x.id === id ? fn(x) : x)));

  // Avance de un paso respetando automatizaciones activas (Bloque 7 — funcionan de verdad)
  const advanceStep = (flowId: string, stepId: string, status: StepStatus) => {
    update(flowId, (f) => {
      const steps = f.steps.map((s) => (s.id === stepId ? { ...s, status } : s));
      // Avance automático: al completar, activa el siguiente pendiente
      if (status === 'hecho' && autos.isOn('auto-advance')) {
        const idx = steps.findIndex((s) => s.id === stepId);
        const next = steps.slice(idx + 1).find((s) => s.status === 'pendiente');
        if (next) next.status = next.needsApproval ? 'bloqueado' : 'en_curso';
      }
      let fStatus = f.status;
      if (autos.isOn('autoclose') && steps.every((s) => s.status === 'hecho')) fStatus = 'completado';
      return { ...f, steps, status: fStatus };
    });
  };

  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [
    { key: 'resumen', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'flujos', label: 'Flujos', icon: Workflow },
    { key: 'automatizaciones', label: 'Automatizaciones', icon: Zap },
    { key: 'aprobaciones', label: 'Aprobaciones', icon: CheckSquare },
    { key: 'plantillas', label: 'Plantillas', icon: LayoutTemplate },
    { key: 'generar', label: 'Generar con IA', icon: Wand2 },
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
      subtitle="Aquí tienes el estado general de tus flujos y procesos."
      cta={{ label: 'Nuevo flujo', icon: Plus, onClick: () => setView('plantillas') }}
    >
      <Kpis flows={flows} autosOn={autos.onCount} accent={agent.color} />

      {view === 'resumen' && <Resumen flows={flows} autos={autos} accent={agent.color} onGo={setView} onAdvance={advanceStep} />}
      {view === 'flujos' && <Flujos flows={flows} accent={agent.color} onAdvance={advanceStep} onRemove={remove} onGo={() => setView('plantillas')} />}
      {view === 'automatizaciones' && <AutomationsPanel autos={autos} accent={agent.color} title="Automatizaciones de Saguaro" />}
      {view === 'aprobaciones' && <Aprobaciones flows={flows} accent={agent.color} onAdvance={advanceStep} />}
      {view === 'plantillas' && <Plantillas accent={agent.color} onUse={(t) => { add(flowFromTemplate(t)); setView('flujos'); }} />}
      {view === 'generar' && <Generar agent={agent} onSave={(f) => { add(f); setView('flujos'); }} />}

      <QuickActionsBar
        accent={agent.color}
        actions={[
          { label: 'Nuevo flujo', icon: Plus, onClick: () => setView('plantillas') },
          { label: 'Generar con IA', icon: Wand2, onClick: () => setView('generar') },
          { label: 'Aprobaciones', icon: CheckSquare, onClick: () => setView('aprobaciones') },
          { label: 'Automatizaciones', icon: Zap, onClick: () => setView('automatizaciones') },
        ]}
      />
    </AgentAppShell>
  );
}

// ── KPIs honestos ─────────────────────────────────────────────────────────────
function Kpis({ flows, autosOn, accent }: { flows: Flow[]; autosOn: number; accent: string }) {
  const activos = flows.filter((f) => f.status === 'activo').length;
  const pasos = flows.reduce((n, f) => n + f.steps.length, 0);
  const enCurso = flows.reduce((n, f) => n + f.steps.filter((s) => s.status === 'en_curso').length, 0);
  const completados = flows.filter((f) => f.status === 'completado').length;
  const aprob = flows.reduce((n, f) => n + f.steps.filter((s) => s.status === 'bloqueado').length, 0);
  const hechos = flows.reduce((n, f) => n + f.steps.filter((s) => s.status === 'hecho').length, 0);
  const sla = pasos ? Math.round((hechos / pasos) * 100) : 0;
  const data: Kpi[] = [
    { label: 'Flujos activos', value: activos, icon: <Workflow className="h-4 w-4" /> },
    { label: 'Pasos totales', value: pasos, icon: <GitBranch className="h-4 w-4" /> },
    { label: 'En ejecución', value: enCurso, icon: <Play className="h-4 w-4" /> },
    { label: 'Completados', value: completados, icon: <Check className="h-4 w-4" /> },
    { label: 'Aprobaciones', value: aprob, icon: <CheckSquare className="h-4 w-4" /> },
    { label: '% avance', value: `${sla}%`, icon: <CircleDot className="h-4 w-4" />, hint: `${autosOn} automatizaciones activas` },
  ];
  return <KpiRow items={data} accent={accent} />;
}

// ── Donut SVG ──────────────────────────────────────────────────────────────────
function Donut({ pct, accent, label }: { pct: number; accent: string; label?: string }) {
  const r = 42, c = 2 * Math.PI * r, off = c - (pct / 100) * c;
  return (
    <div className="relative flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" className="text-muted" strokeWidth="12" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={accent} strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-2xl font-bold">{pct}%</div>
        {label && <div className="text-[10px] text-muted-foreground">{label}</div>}
      </div>
    </div>
  );
}

// ── Resumen (dashboard fiel a vista 22) ──────────────────────────────────────
function Resumen({
  flows, autos, accent, onGo, onAdvance,
}: {
  flows: Flow[]; autos: ReturnType<typeof useAutomations>; accent: string;
  onGo: (v: View) => void; onAdvance: (fl: string, st: string, s: StepStatus) => void;
}) {
  const byStatus: { key: FlowStatus; label: string; color: string }[] = [
    { key: 'activo', label: 'Activos', color: '#3b82f6' },
    { key: 'pausado', label: 'Pausados', color: '#f59e0b' },
    { key: 'completado', label: 'Completados', color: '#22c55e' },
    { key: 'borrador', label: 'Borradores', color: '#94a3b8' },
  ];
  const counts = byStatus.map((s) => ({ ...s, n: flows.filter((f) => f.status === s.key).length }));
  const pasos = flows.reduce((n, f) => n + f.steps.length, 0);
  const hechos = flows.reduce((n, f) => n + f.steps.filter((s) => s.status === 'hecho').length, 0);
  const avance = pasos ? Math.round((hechos / pasos) * 100) : 0;
  const running = flows.find((f) => f.status === 'activo') || flows[0];
  const pendientes = flows.flatMap((f) => f.steps.filter((s) => s.status === 'bloqueado').map((s) => ({ f, s })));

  if (flows.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8">
        <EmptyState icon={Workflow} title="Aún no tienes flujos" text="Crea uno desde una plantilla o pídele a la IA que lo diseñe por ti." accent={accent}
          cta={{ label: 'Ver plantillas', onClick: () => onGo('plantillas') }} />
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          {/* Estado general */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 font-display font-semibold">Estado general de flujos</h3>
            <div className="flex items-center gap-5">
              <Donut pct={avance} accent={accent} label="avance" />
              <ul className="flex-1 space-y-1.5">
                {counts.map((s) => (
                  <li key={s.key} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />{s.label}</span>
                    <span className="font-semibold">{s.n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 font-display font-semibold">Actividad reciente</h3>
            <ul className="space-y-2.5">
              {flows.slice(0, 4).map((f) => (
                <li key={f.id} className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: accent + '14', color: accent }}>
                    <Workflow className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{f.name}</div>
                    <div className="text-[11px] text-muted-foreground">{f.area} · {f.steps.filter((s) => s.status === 'hecho').length}/{f.steps.length} pasos</div>
                  </div>
                  <StatusPill status={f.status} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Flujo en ejecución — tablero por pasos */}
        {running && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display font-semibold">Flujo en ejecución · {running.name}</h3>
              <button onClick={() => onGo('flujos')} className="text-xs font-medium" style={{ color: accent }}>Ver todos →</button>
            </div>
            <StepBoard flow={running} accent={accent} onAdvance={onAdvance} />
          </div>
        )}
      </div>

      <aside className="space-y-5">
        {/* Automatizaciones activas */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4" style={{ color: accent }} />
            <h3 className="font-display font-semibold">Automatizaciones</h3>
          </div>
          <div className="space-y-2.5">
            {autos.list.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{a.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{a.trigger}</div>
                </div>
                <Toggle on={a.enabled} accent={accent} onClick={() => autos.toggle(a.id)} />
              </div>
            ))}
          </div>
        </div>

        {/* Aprobaciones pendientes */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <CheckSquare className="h-4 w-4" style={{ color: accent }} />
            <h3 className="font-display font-semibold">Aprobaciones pendientes</h3>
          </div>
          {pendientes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nada por aprobar 🎉</p>
          ) : (
            <ul className="space-y-2.5">
              {pendientes.slice(0, 4).map(({ f, s }) => (
                <li key={s.id} className="rounded-xl border border-border p-2.5">
                  <div className="truncate text-sm font-medium">{s.name}</div>
                  <div className="mb-2 truncate text-[11px] text-muted-foreground">{f.name} · {s.role}</div>
                  <div className="flex gap-1.5">
                    <button onClick={() => onAdvance(f.id, s.id, 'hecho')} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: accent }}>
                      <Check className="h-3.5 w-3.5" /> Aprobar
                    </button>
                    <button onClick={() => onAdvance(f.id, s.id, 'pendiente')} className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

// ── Tablero de pasos ──────────────────────────────────────────────────────────
function StepBoard({ flow, accent, onAdvance }: { flow: Flow; accent: string; onAdvance: (fl: string, st: string, s: StepStatus) => void }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1">
      {flow.steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2.5">
          <div className="w-44 shrink-0 rounded-xl border border-border bg-background p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: STEP_COLOR[s.status] }}>{STEP_LABEL[s.status]}</span>
              <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
            </div>
            <div className="truncate text-sm font-medium">{s.name}</div>
            <div className="mb-2 text-[11px] text-muted-foreground">{s.role}</div>
            <div className="flex gap-1">
              {s.status !== 'hecho' && (
                <button onClick={() => onAdvance(flow.id, s.id, 'hecho')} className="rounded p-1 text-emerald-600 hover:bg-emerald-50" title="Marcar hecho"><Check className="h-3.5 w-3.5" /></button>
              )}
              {s.status === 'pendiente' && (
                <button onClick={() => onAdvance(flow.id, s.id, 'en_curso')} className="rounded p-1 text-blue-600 hover:bg-blue-50" title="Iniciar"><Play className="h-3.5 w-3.5" /></button>
              )}
              {s.status === 'hecho' && (
                <button onClick={() => onAdvance(flow.id, s.id, 'pendiente')} className="rounded p-1 text-muted-foreground hover:bg-muted" title="Reabrir"><Clock className="h-3.5 w-3.5" /></button>
              )}
            </div>
          </div>
          {i < flow.steps.length - 1 && <span className="text-muted-foreground" style={{ color: accent }}>→</span>}
        </div>
      ))}
    </div>
  );
}

// ── Flujos (lista completa) ───────────────────────────────────────────────────
function Flujos({ flows, accent, onAdvance, onRemove, onGo }: { flows: Flow[]; accent: string; onAdvance: (fl: string, st: string, s: StepStatus) => void; onRemove: (id: string) => void; onGo: () => void }) {
  if (flows.length === 0) {
    return <div className="rounded-2xl border border-border bg-card p-5"><EmptyState icon={Workflow} title="Sin flujos" text="Crea tu primer flujo desde una plantilla." accent={accent} cta={{ label: 'Ver plantillas', onClick: onGo }} /></div>;
  }
  return (
    <div className="space-y-4">
      {flows.map((f) => (
        <div key={f.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: accent + '14', color: accent }}><Workflow className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-sm font-semibold">{f.name}</div>
              <div className="text-[11px] text-muted-foreground">{f.area}</div>
            </div>
            <StatusPill status={f.status} />
            <button onClick={() => onRemove(f.id)} title="Eliminar" className="rounded p-1.5 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
          </div>
          <StepBoard flow={f} accent={accent} onAdvance={onAdvance} />
        </div>
      ))}
    </div>
  );
}

// ── Aprobaciones ──────────────────────────────────────────────────────────────
function Aprobaciones({ flows, accent, onAdvance }: { flows: Flow[]; accent: string; onAdvance: (fl: string, st: string, s: StepStatus) => void }) {
  const pend = flows.flatMap((f) => f.steps.filter((s) => s.status === 'bloqueado').map((s) => ({ f, s })));
  if (pend.length === 0) {
    return <div className="rounded-2xl border border-border bg-card p-5"><EmptyState icon={CheckSquare} title="Sin aprobaciones pendientes" text="Cuando un paso requiera aprobación aparecerá aquí." accent={accent} /></div>;
  }
  return (
    <div className="space-y-3">
      {pend.map(({ f, s }) => (
        <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: '#f59e0b22', color: '#f59e0b' }}><CheckSquare className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{s.name}</div>
            <div className="text-[11px] text-muted-foreground">{f.name} · {s.role}</div>
          </div>
          <button onClick={() => onAdvance(f.id, s.id, 'hecho')} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: accent }}><Check className="h-3.5 w-3.5" /> Aprobar</button>
          <button onClick={() => onAdvance(f.id, s.id, 'pendiente')} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /> Rechazar</button>
        </div>
      ))}
    </div>
  );
}

// ── Plantillas ────────────────────────────────────────────────────────────────
function Plantillas({ accent, onUse }: { accent: string; onUse: (t: (typeof TEMPLATES)[number]) => void }) {
  return (
    <div>
      <h3 className="mb-4 font-display text-lg font-semibold">Crea un nuevo flujo desde plantilla</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TEMPLATES.map((t) => (
          <div key={t.name} className="flex flex-col rounded-2xl border border-border bg-card p-4">
            <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: accent + '14', color: accent }}><ListChecks className="h-4.5 w-4.5" /></span>
            <div className="font-display text-sm font-semibold">{t.name}</div>
            <div className="mb-2 text-[11px] text-muted-foreground">{t.area} · {t.steps.length} pasos</div>
            <ol className="mb-3 flex-1 space-y-0.5 text-[11px] text-muted-foreground">
              {t.steps.map((s, i) => <li key={i}>{i + 1}. {s.name}</li>)}
            </ol>
            <button onClick={() => onUse(t)} className="inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-white" style={{ backgroundColor: accent }}><Plus className="h-3.5 w-3.5" /> Usar plantilla</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Generar con IA ────────────────────────────────────────────────────────────
function Generar({ agent, onSave }: { agent: SaguaroAgent; onSave: (f: Flow) => void }) {
  const [goal, setGoal] = useState('');
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; steps: { name: string; role: string; approval?: boolean }[]; note: string } | null>(null);

  async function generate() {
    const g = goal.trim();
    if (!g || loading) return;
    setLoading(true); setError(null); setDraft(null);
    const prompt = `Eres Saguaro, experto en diseño de procesos (BPM). Diseña un flujo de trabajo para este objetivo: "${g}"${area.trim() ? ` (área: ${area.trim()})` : ''}.
Devuelve SOLO un JSON válido con esta forma exacta:
{"name":"nombre corto del flujo","steps":[{"name":"nombre del paso","role":"responsable","approval":false}],"note":"1 frase de recomendación"}
Reglas: entre 4 y 7 pasos, en orden lógico; marca approval=true en los pasos que requieran aprobación/visto bueno. Sin texto fuera del JSON.`;
    try {
      const res = await fetch('/api/cactus/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: agent.slug, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar.');
      let t = String(data.content || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
      const s = t.indexOf('{'), e = t.lastIndexOf('}');
      if (s !== -1 && e !== -1) t = t.slice(s, e + 1);
      const parsed = JSON.parse(t);
      setDraft({ name: String(parsed.name || g), steps: Array.isArray(parsed.steps) ? parsed.steps : [], note: String(parsed.note || '') });
    } catch (e: any) {
      setError(e?.message || 'El modelo no devolvió un flujo válido. Reintenta.');
    } finally { setLoading(false); }
  }

  function save() {
    if (!draft) return;
    onSave({
      id: uid(), name: draft.name, area: area.trim() || 'General', status: 'activo', createdAt: Date.now(),
      steps: draft.steps.map((s, i) => ({ id: uid(), name: s.name, role: s.role || '—', status: i === 0 ? 'en_curso' : 'pendiente', needsApproval: !!s.approval })),
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 font-display text-lg font-semibold">Generador de flujos</h3>
        <Field label="¿Qué proceso quieres automatizar?">
          <textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={3} placeholder="Ej. gestionar pedidos desde la web hasta la entrega" className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        </Field>
        <Field label="Área (opcional)">
          <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ej. Operaciones" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        </Field>
        <button onClick={generate} disabled={loading || !goal.trim()} className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: agent.color }}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}{loading ? 'Diseñando…' : 'Diseñar flujo'}
        </button>
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Propuesta</h3>
          {draft && <button onClick={save} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: agent.color }}><Check className="h-3.5 w-3.5" /> Crear flujo</button>}
        </div>
        {!draft && !loading && <EmptyState icon={Sparkles} title="Tu flujo aparecerá aquí" text="Describe el proceso y Saguaro propone los pasos y responsables." accent={agent.color} />}
        {loading && <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Diseñando el flujo…</div>}
        {draft && (
          <div>
            <div className="mb-3 font-display font-semibold">{draft.name}</div>
            <ol className="space-y-2">
              {draft.steps.map((s, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl border border-border p-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: agent.color }}>{i + 1}</span>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{s.name}</div><div className="text-[11px] text-muted-foreground">{s.role}</div></div>
                  {s.approval && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: '#f59e0b' }}>Aprobación</span>}
                </li>
              ))}
            </ol>
            {draft.note && <p className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">{draft.note}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Primitivos ────────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: FlowStatus }) {
  const map: Record<FlowStatus, { label: string; color: string }> = {
    activo: { label: 'Activo', color: '#3b82f6' }, pausado: { label: 'Pausado', color: '#f59e0b' },
    completado: { label: 'Completado', color: '#22c55e' }, borrador: { label: 'Borrador', color: '#94a3b8' },
  };
  const s = map[status];
  return <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: s.color }}>{s.label}</span>;
}

function Toggle({ on, accent, onClick }: { on: boolean; accent: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative h-5 w-9 shrink-0 rounded-full transition-colors" style={{ backgroundColor: on ? accent : 'var(--muted, #e5e7eb)' }} aria-pressed={on}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-3"><label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>{children}</div>;
}

function EmptyState({ icon: Icon, title, text, cta, accent }: { icon: typeof Workflow; title: string; text: string; cta?: { label: string; onClick: () => void }; accent: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: accent + '14', color: accent }}><Icon className="h-6 w-6" /></span>
      <h4 className="font-display font-semibold">{title}</h4>
      <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
      {cta && <button onClick={cta.onClick} className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white" style={{ backgroundColor: accent }}><Plus className="h-4 w-4" /> {cta.label}</button>}
    </div>
  );
}
