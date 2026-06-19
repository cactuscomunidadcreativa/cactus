'use client';

import { useEffect, useState } from 'react';
import { Markdown } from '@/components/cactus/shared/markdown';
import Link from 'next/link';
import {
  Sparkles, FolderOpen, Plus, Loader2, Wand2, Copy, Check, Trash2, ChevronDown, Lock, type LucideIcon,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { QuickActionsBar } from '@/components/cactus/app-shell/quick-actions-bar';
import { DocAttach, withDoc, type Attached } from '@/components/cactus/apps/shared/doc-attach';
import { SubAgentBar } from '@/components/cactus/apps/shared/sub-agent-bar';

export interface StudioAgent { slug: string; name: string; role: string; color: string; image: string }
export interface StudioField { key: string; label: string; type: 'text' | 'textarea' | 'select'; options?: string[]; placeholder?: string }
export interface StudioConfig {
  greeting: string;            // emoji
  subtitle: string;
  createIcon: LucideIcon;
  createLabel: string;         // "Nuevo video"
  outputLabel: string;         // "Tratamiento"
  fields: StudioField[];
  titleKey: string;            // qué campo es el título del proyecto
  systemRole: string;          // "Eres Candelabro, director de video…"
  task: string;                // qué producir (estructura)
  docLabel: string;
  docIntro: string;
  kpis: { label: string; locked?: boolean; hint?: string }[];
  locked: { title: string; text: string };
  storageKey: string;
  maxTokens?: number;
}

interface Project { id: string; title: string; values: Record<string, string>; content: string; createdAt: number }
const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

type View = 'crear' | 'proyectos';

export function CreativeStudio({ agent, user, credits, config }: { agent: StudioAgent; user?: ShellUser; credits?: number; config: StudioConfig }) {
  const [view, setView] = useState<View>('crear');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { try { const raw = localStorage.getItem(config.storageKey); if (raw) setProjects(JSON.parse(raw)); } catch { /* noop */ } setLoaded(true); }, [config.storageKey]);
  useEffect(() => { if (loaded) { try { localStorage.setItem(config.storageKey, JSON.stringify(projects)); } catch { /* noop */ } } }, [config.storageKey, projects, loaded]);

  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [
    { key: 'crear', label: config.createLabel, icon: config.createIcon },
    { key: 'proyectos', label: 'Proyectos', icon: FolderOpen },
    { key: 'render', label: 'Render & export', icon: Lock, href: '/empresa', section: 'Conecta' },
  ];
  const kpis: Kpi[] = config.kpis.map((k, i) => ({ label: k.label, value: k.locked ? '—' : projects.length, icon: i === 0 ? <FolderOpen className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />, hint: k.hint }));

  return (
    <AgentAppShell
      agent={agent} nav={nav} activeNav={view}
      onNav={(k) => { if (k !== 'render') setView(k as View); }}
      user={user} credits={credits}
      greeting={`Hola${firstName ? `, ${firstName}` : ''} ${config.greeting}`}
      subtitle={config.subtitle}
      cta={{ label: config.createLabel, icon: config.createIcon, onClick: () => setView('crear') }}
    >
      <KpiRow items={kpis} accent={agent.color} />
      {view === 'crear'
        ? <Crear agent={agent} config={config} onSave={(p) => { setProjects((prev) => [p, ...prev]); }} />
        : <Proyectos projects={projects} accent={agent.color} config={config} onRemove={(id) => setProjects((p) => p.filter((x) => x.id !== id))} onNew={() => setView('crear')} />}
      <LockedRender accent={agent.color} locked={config.locked} />
      <QuickActionsBar accent={agent.color} actions={[
        { label: config.createLabel, icon: config.createIcon, onClick: () => setView('crear') },
        { label: 'Proyectos', icon: FolderOpen, onClick: () => setView('proyectos') },
        { label: 'Pídele a Ramona', icon: Sparkles, href: '/orchestrator' },
      ]} />
    </AgentAppShell>
  );
}

function Crear({ agent, config, onSave }: { agent: StudioAgent; config: StudioConfig; onSave: (p: Project) => void }) {
  const initial = Object.fromEntries(config.fields.map((f) => [f.key, f.type === 'select' ? (f.options?.[0] || '') : '']));
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [doc, setDoc] = useState<Attached | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [subAgent, setSubAgent] = useState<string | null>(null);
  const c = agent.color;
  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));
  const titleVal = values[config.titleKey]?.trim();

  async function generate() {
    if (!titleVal || loading) return;
    setLoading(true); setError(null); setOut(null);
    const lines = config.fields.map((f) => `- ${f.label}: ${values[f.key]?.trim() || '—'}`).join('\n');
    const prompt = withDoc(`${config.systemRole}\n${config.task}\nDatos:\n${lines}\nSin preámbulo.`, doc, config.docIntro);
    try {
      const res = await fetch('/api/cactus/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: agent.slug, subAgent, messages: [{ role: 'user', content: prompt }], maxTokens: config.maxTokens || 1600 }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setOut(String(data.content || '').trim());
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoading(false); }
  }
  async function copy() { if (!out) return; try { await navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ } }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-display text-lg font-semibold">{config.createLabel}</h3>
        {config.fields.map((f) => (
          <div key={f.key} className="mb-3">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{f.label}</label>
            {f.type === 'select' ? (
              <select value={values[f.key]} onChange={(e) => set(f.key, e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none">{f.options!.map((o) => <option key={o}>{o}</option>)}</select>
            ) : f.type === 'textarea' ? (
              <textarea value={values[f.key]} onChange={(e) => set(f.key, e.target.value)} rows={3} placeholder={f.placeholder} className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
            ) : (
              <input value={values[f.key]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
            )}
          </div>
        ))}
        <div className="mb-3"><DocAttach accent={c} attached={doc} onChange={setDoc} label={config.docLabel} /></div>
        <SubAgentBar slug={agent.slug} value={subAgent} onChange={setSubAgent} accent={c} />
        <button onClick={generate} disabled={loading || !titleVal} className="inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: c }}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generar {config.outputLabel.toLowerCase()}</button>
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">{config.outputLabel}</h3>
          {out && <div className="flex items-center gap-1.5"><button onClick={copy} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted">{copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copiar</button><button onClick={() => { onSave({ id: uid(), title: titleVal || config.outputLabel, values, content: out, createdAt: Date.now() }); }} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: c }}><Check className="h-3.5 w-3.5" /> Guardar</button></div>}
        </div>
        {!out && !loading && <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground"><config.createIcon className="h-7 w-7 opacity-50" /><p className="max-w-xs text-sm">Completa el brief y {agent.name} lo crea.</p></div>}
        {loading && <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {agent.name} está creando…</div>}
        {out && <Markdown text={out} className="text-sm leading-relaxed text-foreground/90" />}
      </div>
    </div>
  );
}

function Proyectos({ projects, accent, config, onRemove, onNew }: { projects: Project[]; accent: string; config: StudioConfig; onRemove: (id: string) => void; onNew: () => void }) {
  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <FolderOpen className="mx-auto mb-2 h-7 w-7 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">Aún no hay proyectos. Crea el primero.</p>
        <button onClick={onNew} className="mt-3 rounded-lg px-3.5 py-2 text-sm font-semibold text-white" style={{ backgroundColor: accent }}>{config.createLabel}</button>
      </div>
    );
  }
  return <div className="space-y-3">{[...projects].sort((a, b) => b.createdAt - a.createdAt).map((p) => <ProjectCard key={p.id} p={p} accent={accent} config={config} onRemove={() => onRemove(p.id)} />)}</div>;
}

function ProjectCard({ p, accent, config, onRemove }: { p: Project; accent: string; config: StudioConfig; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  async function copy() { try { await navigator.clipboard.writeText(p.content); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ } }
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: accent + '14', color: accent }}><config.createIcon className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{p.title}</div><div className="truncate text-[11px] text-muted-foreground">{config.fields.slice(1, 3).map((f) => p.values[f.key]).filter(Boolean).join(' · ')}</div></div>
        <button onClick={copy} className="rounded p-1.5 text-muted-foreground hover:bg-muted">{copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</button>
        <button onClick={onRemove} className="rounded p-1.5 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
        <button onClick={() => setOpen((o) => !o)} className="rounded p-1.5 text-muted-foreground hover:bg-muted"><ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} /></button>
      </div>
      {open && <Markdown text={p.content} className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-foreground/90" />}
    </div>
  );
}

function LockedRender({ accent, locked }: { accent: string; locked: { title: string; text: string } }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5">
      <div className="flex items-center gap-2 text-sm font-medium"><Lock className="h-4 w-4" style={{ color: accent }} /> {locked.title}</div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{locked.text} <Link href="/empresa" className="font-semibold" style={{ color: accent }}>Conectar →</Link></p>
    </div>
  );
}
