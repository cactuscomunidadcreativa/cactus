'use client';

import { useEffect, useState } from 'react';
import {
  Inbox, MessageSquare, Plus, Loader2, Wand2, Send, Check, Trash2, Clock, CheckCircle2, Plug, Zap,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { QuickActionsBar } from '@/components/cactus/app-shell/quick-actions-bar';
import { DocAttach, withDoc, type Attached } from '@/components/cactus/apps/shared/doc-attach';
import { SubAgentBar } from '@/components/cactus/apps/shared/sub-agent-bar';
import { useAutomations, AutomationsPanel } from '@/components/cactus/apps/shared/automations';
import { defaultAutomationsFor } from '@/lib/cactus/automations-catalog';

interface AloeAgent { slug: string; name: string; role: string; color: string; image: string }

type Status = 'abierto' | 'en_proceso' | 'resuelto';
type Priority = 'baja' | 'media' | 'alta';
const STATUS: Record<Status, { label: string; cls: string }> = {
  abierto: { label: 'Abierto', cls: 'bg-amber-100 text-amber-700' },
  en_proceso: { label: 'En proceso', cls: 'bg-sky-100 text-sky-700' },
  resuelto: { label: 'Resuelto', cls: 'bg-emerald-100 text-emerald-700' },
};
const PRIORITY: Record<Priority, string> = { baja: 'text-muted-foreground', media: 'text-amber-600', alta: 'text-red-600' };

interface TMsg { from: 'cliente' | 'agente'; text: string }
interface Ticket { id: string; subject: string; customer: string; channel: string; priority: Priority; status: Status; messages: TMsg[]; createdAt: number }
const STORAGE = 'cactus.aloe.tickets.v1';
const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

function useStored<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { try { const raw = localStorage.getItem(key); if (raw) setVal(JSON.parse(raw)); } catch { /* noop */ } setLoaded(true); }, [key]);
  useEffect(() => { if (loaded) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ } } }, [key, val, loaded]);
  return [val, setVal];
}

type View = 'bandeja' | 'nuevo' | 'automatizaciones';

export function AloeApp({ agent, user, credits }: { agent: AloeAgent; user?: ShellUser; credits?: number }) {
  const [view, setView] = useState<View>('bandeja');
  const [tickets, setTickets] = useStored<Ticket[]>(STORAGE, []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const autos = useAutomations(agent.slug, defaultAutomationsFor(agent.slug));

  const update = (id: string, patch: Partial<Ticket>) => setTickets((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const remove = (id: string) => { setTickets((p) => p.filter((t) => t.id !== id)); setSelectedId((s) => (s === id ? null : s)); };
  const addReply = (id: string, msg: TMsg) => setTickets((p) => p.map((t) => (t.id === id ? { ...t, messages: [...t.messages, msg] } : t)));

  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [
    { key: 'bandeja', label: 'Bandeja', icon: Inbox },
    { key: 'nuevo', label: 'Nuevo ticket', icon: Plus },
    { key: 'conexiones', label: 'WhatsApp & correo', icon: Plug, href: '/empresa', section: 'Conecta' },
    { key: 'automatizaciones', label: 'Automatizaciones', icon: Zap },
  ];
  const kpis: Kpi[] = [
    { label: 'Abiertos', value: tickets.filter((t) => t.status === 'abierto').length, icon: <Inbox className="h-4 w-4" /> },
    { label: 'En proceso', value: tickets.filter((t) => t.status === 'en_proceso').length, icon: <Clock className="h-4 w-4" /> },
    { label: 'Resueltos', value: tickets.filter((t) => t.status === 'resuelto').length, icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: 'Total', value: tickets.length, icon: <MessageSquare className="h-4 w-4" /> },
  ];

  const selected = tickets.find((t) => t.id === selectedId) || null;

  return (
    <AgentAppShell
      agent={agent} nav={nav} activeNav={view}
      onNav={(k) => { if (k !== 'conexiones') setView(k as View); }}
      user={user} credits={credits}
      greeting={`Hola${firstName ? `, ${firstName}` : ''} 💬`}
      subtitle="Atención al cliente con Aloe"
      cta={{ label: 'Nuevo ticket', icon: Plus, onClick: () => setView('nuevo') }}
    >
      <KpiRow items={kpis} accent={agent.color} />
      {view === 'bandeja' && (
        <Bandeja agent={agent} tickets={tickets} selected={selected} onSelect={setSelectedId} onUpdate={update} onRemove={remove} onReply={addReply} onNew={() => setView('nuevo')} />
      )}
      {view === 'nuevo' && (
        <Nuevo accent={agent.color} onCreate={(t) => { setTickets((p) => [t, ...p]); setSelectedId(t.id); setView('bandeja'); }} />
      )}
      {view === 'automatizaciones' && <AutomationsPanel autos={autos} accent={agent.color} />}
      <QuickActionsBar accent={agent.color} actions={[
        { label: 'Bandeja', icon: Inbox, onClick: () => setView('bandeja') },
        { label: 'Nuevo ticket', icon: Plus, onClick: () => setView('nuevo') },
        { label: 'Conectar canales', icon: Plug, href: '/empresa' },
      ]} />
    </AgentAppShell>
  );
}

function Bandeja({
  agent, tickets, selected, onSelect, onUpdate, onRemove, onReply, onNew,
}: {
  agent: AloeAgent; tickets: Ticket[]; selected: Ticket | null;
  onSelect: (id: string) => void; onUpdate: (id: string, p: Partial<Ticket>) => void; onRemove: (id: string) => void;
  onReply: (id: string, m: TMsg) => void; onNew: () => void;
}) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <Inbox className="mx-auto mb-2 h-7 w-7 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">Sin tickets. Crea el primero o conecta tus canales (WhatsApp, correo).</p>
        <button onClick={onNew} className="mt-3 rounded-lg px-3.5 py-2 text-sm font-semibold text-white" style={{ backgroundColor: agent.color }}>Nuevo ticket</button>
      </div>
    );
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="space-y-2">
        {[...tickets].sort((a, b) => b.createdAt - a.createdAt).map((t) => {
          const active = selected?.id === t.id;
          return (
            <button key={t.id} onClick={() => onSelect(t.id)} className={`w-full rounded-xl border bg-card p-3 text-left transition-colors ${active ? '' : 'border-border hover:bg-muted/40'}`} style={active ? { borderColor: agent.color, boxShadow: `0 0 0 1px ${agent.color}` } : undefined}>
              <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium">{t.subject}</span><span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${STATUS[t.status].cls}`}>{STATUS[t.status].label}</span></div>
              <div className="truncate text-[11px] text-muted-foreground">{t.customer} · {t.channel} · <span className={PRIORITY[t.priority]}>prioridad {t.priority}</span></div>
            </button>
          );
        })}
      </div>
      {selected ? <Detalle agent={agent} ticket={selected} onUpdate={onUpdate} onRemove={onRemove} onReply={onReply} /> : (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground"><p className="text-sm">Selecciona un ticket para ver la conversación.</p></div>
      )}
    </div>
  );
}

function Detalle({
  agent, ticket, onUpdate, onRemove, onReply,
}: {
  agent: AloeAgent; ticket: Ticket; onUpdate: (id: string, p: Partial<Ticket>) => void; onRemove: (id: string) => void; onReply: (id: string, m: TMsg) => void;
}) {
  const [reply, setReply] = useState('');
  const [doc, setDoc] = useState<Attached | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subAgent, setSubAgent] = useState<string | null>(null);
  const c = agent.color;

  async function draft() {
    if (loading) return;
    setLoading(true); setError(null);
    const thread = ticket.messages.map((m) => `${m.from === 'cliente' ? 'Cliente' : 'Soporte'}: ${m.text}`).join('\n');
    const prompt = withDoc(
      `Eres soporte al cliente, cálido y resolutivo. Asunto: "${ticket.subject}". Cliente: ${ticket.customer}.\nConversación:\n${thread}\n\n` +
      `Redacta la SIGUIENTE respuesta del soporte: empática, clara, con la solución o los siguientes pasos. Breve y profesional. Solo el mensaje, sin firmar con nombre.`,
      doc, 'Apóyate en esta política/base de conocimiento',
    );
    try {
      const res = await fetch('/api/cactus/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: agent.slug, subAgent, messages: [{ role: 'user', content: prompt }], maxTokens: 600 }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setReply(String(data.content || '').trim());
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoading(false); }
  }
  function send() { const t = reply.trim(); if (!t) return; onReply(ticket.id, { from: 'agente', text: t }); setReply(''); if (ticket.status === 'abierto') onUpdate(ticket.id, { status: 'en_proceso' }); }

  return (
    <div className="flex min-h-[480px] flex-col rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
        <div className="min-w-0 flex-1"><h3 className="truncate font-display font-semibold">{ticket.subject}</h3><p className="text-xs text-muted-foreground">{ticket.customer} · {ticket.channel}</p></div>
        <select value={ticket.priority} onChange={(e) => onUpdate(ticket.id, { priority: e.target.value as Priority })} className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none">
          {(['baja', 'media', 'alta'] as Priority[]).map((p) => <option key={p} value={p}>Prioridad {p}</option>)}
        </select>
        <select value={ticket.status} onChange={(e) => onUpdate(ticket.id, { status: e.target.value as Status })} className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none">
          {(Object.keys(STATUS) as Status[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </select>
        <button onClick={() => onRemove(ticket.id)} className="rounded-md p-1.5 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {ticket.messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'agente' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${m.from === 'agente' ? 'text-white' : 'bg-muted text-foreground'}`} style={m.from === 'agente' ? { backgroundColor: c } : undefined}>{m.text}</div>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-3">
        <SubAgentBar slug={agent.slug} value={subAgent} onChange={setSubAgent} accent={c} />
        <div className="mb-2 flex items-center gap-2">
          <button onClick={draft} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: c }}>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} Borrador con IA</button>
          <DocAttach accent={c} attached={doc} onChange={setDoc} label="Adjuntar política" />
          {ticket.status !== 'resuelto' && <button onClick={() => onUpdate(ticket.id, { status: 'resuelto' })} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted"><Check className="h-3.5 w-3.5" /> Resolver</button>}
        </div>
        {error && <p className="mb-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} rows={2} placeholder="Escribe tu respuesta…" className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
          <button onClick={send} disabled={!reply.trim()} className="flex h-9 w-9 items-center justify-center rounded-lg text-white disabled:opacity-50" style={{ backgroundColor: c }}><Send className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

function Nuevo({ accent, onCreate }: { accent: string; onCreate: (t: Ticket) => void }) {
  const [subject, setSubject] = useState(''); const [customer, setCustomer] = useState(''); const [channel, setChannel] = useState('WhatsApp'); const [priority, setPriority] = useState<Priority>('media'); const [first, setFirst] = useState('');
  const create = () => {
    if (!subject.trim()) return;
    onCreate({ id: uid(), subject: subject.trim(), customer: customer.trim() || 'Cliente', channel, priority, status: 'abierto', messages: first.trim() ? [{ from: 'cliente', text: first.trim() }] : [], createdAt: Date.now() });
  };
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-4 font-display text-lg font-semibold">Nuevo ticket</h3>
      <div className="space-y-3">
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Asunto" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        <div className="grid grid-cols-2 gap-3">
          <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Cliente" className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none">{['WhatsApp', 'Correo', 'Instagram', 'Facebook', 'Web'].map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none">{(['baja', 'media', 'alta'] as Priority[]).map((p) => <option key={p} value={p}>Prioridad {p}</option>)}</select>
        <textarea value={first} onChange={(e) => setFirst(e.target.value)} rows={3} placeholder="Mensaje del cliente (opcional)" className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        <button onClick={create} disabled={!subject.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: accent }}><Plus className="h-4 w-4" /> Crear ticket</button>
      </div>
    </div>
  );
}
