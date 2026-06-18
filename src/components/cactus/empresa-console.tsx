'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bot, Gauge, Bell, Plug, Loader2, Check, X, Trash2, Plus, Lock, Pencil } from 'lucide-react';
import { getAgent } from '@/lib/cactus/agents-catalog';

type Tab = 'agentes' | 'consumo' | 'alertas' | 'conexiones';

const TABS: { key: Tab; label: string; icon: typeof Bot }[] = [
  { key: 'agentes', label: 'Agentes', icon: Bot },
  { key: 'consumo', label: 'Consumo', icon: Gauge },
  { key: 'alertas', label: 'Alertas', icon: Bell },
  { key: 'conexiones', label: 'Conexiones', icon: Plug },
];

export function EmpresaConsole() {
  const [tab, setTab] = useState<Tab>('agentes');
  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2 border-b border-border">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'border-cactus-green text-cactus-green' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === 'agentes' && <AgentesTab />}
      {tab === 'consumo' && <ConsumoTab />}
      {tab === 'alertas' && <AlertasTab />}
      {tab === 'conexiones' && <ConexionesTab />}
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
}

// ── Agentes (on/off por empresa) ────────────────────────────────────────────
function AgentesTab() {
  const [states, setStates] = useState<any[] | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch('/api/cactus/agents');
    const d = await r.json();
    setStates(d.states || []);
    setCanManage(!!d.canManage);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function toggle(slug: string, isActive: boolean) {
    if (!canManage) return;
    setBusy(slug);
    setStates((s) => (s || []).map((a) => (a.slug === slug ? { ...a, isActive } : a)));
    try {
      const r = await fetch('/api/cactus/agents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, isActive }),
      });
      if (!r.ok) await load(); // revertir si falló
    } finally { setBusy(null); }
  }

  if (!states) return <Spinner />;
  return (
    <div>
      {!canManage && <p className="mb-3 text-xs text-muted-foreground">Solo el owner/admin puede encender o apagar agentes.</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        {states.map((a) => {
          const agent = getAgent(a.slug);
          return (
            <div key={a.slug} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              {agent?.image ? <Image src={agent.image} alt={a.slug} width={34} height={34} className="rounded-lg" /> : <Bot className="h-8 w-8 text-muted-foreground" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{agent?.name || a.slug}</p>
                <p className="text-[11px] text-muted-foreground">
                  {a.available ? (a.inPlan ? 'En tu plan' : 'Activado') : 'No incluido en el plan'}
                </p>
              </div>
              <Link href={`/empresa/agentes/${a.slug}`} title="Editar agente" className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                <Pencil className="h-4 w-4" />
              </Link>
              {a.available ? (
                <button
                  disabled={!canManage || busy === a.slug}
                  onClick={() => toggle(a.slug, !a.isActive)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${a.isActive ? 'bg-cactus-green' : 'bg-muted-foreground/30'}`}
                  aria-label={a.isActive ? 'Apagar' : 'Encender'}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${a.isActive ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground"><Lock className="h-3 w-3" /> Plan</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Consumo (modo + cuota + por agente) ─────────────────────────────────────
const MODES: { key: string; label: string; hint: string }[] = [
  { key: 'ahorro', label: '💸 Ahorro', hint: 'modelo barato, respuestas más cortas' },
  { key: 'equilibrio', label: '⚖️ Equilibrio', hint: 'modelo por defecto' },
  { key: 'calidad', label: '✨ Calidad', hint: 'modelo premium, más profundo' },
];

function ModeSelector() {
  const [mode, setMode] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetch('/api/cactus/company/mode').then((r) => r.json()).then((d) => { setMode(d.mode); setCanManage(!!d.canManage); }); }, []);
  async function pick(m: string) {
    if (!canManage || m === mode) return;
    setBusy(true); const prev = mode; setMode(m);
    try { const r = await fetch('/api/cactus/company/mode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: m }) }); if (!r.ok) setMode(prev); }
    finally { setBusy(false); }
  }
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-2 text-sm font-medium">Modo de IA {!canManage && <span className="text-xs font-normal text-muted-foreground">(solo owner/admin)</span>}</p>
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button key={m.key} onClick={() => pick(m.key)} disabled={busy || !canManage}
            title={m.hint}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-60 ${mode === m.key ? 'border-cactus-green bg-cactus-green/10 text-cactus-green' : 'border-border hover:bg-muted'}`}>
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConsumoTab() {
  const [data, setData] = useState<any | null>(null);
  useEffect(() => { fetch('/api/cactus/usage').then((r) => r.json()).then(setData); }, []);
  if (!data) return <Spinner />;
  const q = data.quota || { used: 0, limit: 0, remaining: -1 };
  const pct = q.limit > 0 ? Math.min(100, Math.round((q.used / q.limit) * 100)) : 0;
  return (
    <div className="space-y-5">
      <ModeSelector />
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Plan {data.plan?.name || '—'}</span>
          <span className="text-muted-foreground">
            {q.limit > 0 ? `${q.used.toLocaleString()} / ${q.limit.toLocaleString()} tokens` : `${q.used.toLocaleString()} tokens · ilimitado`}
          </span>
        </div>
        {q.limit > 0 && (
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-cactus-green'}`} style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold">Consumo del mes por agente</h3>
        {(!data.byAgent || data.byAgent.length === 0) ? (
          <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">Sin consumo registrado este mes.</p>
        ) : (
          <ul className="space-y-1.5">
            {data.byAgent.map((u: any) => {
              const agent = getAgent(u.agent_slug);
              return (
                <li key={u.agent_slug} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 text-sm">
                  {agent?.image ? <Image src={agent.image} alt={u.agent_slug} width={24} height={24} className="rounded" /> : <Bot className="h-5 w-5 text-muted-foreground" />}
                  <span className="flex-1 truncate font-medium">{agent?.name || u.agent_slug}</span>
                  <span className="text-xs text-muted-foreground">{u.calls} usos · {u.tokens.toLocaleString()} tok · {u.credits} cr</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Alertas (feed + escalación) ─────────────────────────────────────────────
function AlertasTab() {
  const [alerts, setAlerts] = useState<any[] | null>(null);
  const load = useCallback(async () => {
    const r = await fetch('/api/cactus/alerts'); const d = await r.json(); setAlerts(d.alerts || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, status: string) {
    setAlerts((a) => (a || []).filter((x) => x.id !== id || status === 'ack'));
    await fetch('/api/cactus/alerts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    load();
  }

  const SEV: Record<string, string> = { info: 'bg-sky-100 text-sky-700', warning: 'bg-amber-100 text-amber-700', critical: 'bg-red-100 text-red-700' };
  if (!alerts) return <Spinner />;
  if (!alerts.length) return <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">Sin alertas. Ramona avisará aquí cuando los observadores o los agentes detecten algo. 🌵</p>;
  return (
    <ul className="space-y-2">
      {alerts.map((a) => (
        <li key={a.id} className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-start gap-2">
            <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${SEV[a.severity] || SEV.info}`}>{a.severity}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{a.title}</p>
              {a.body && <p className="mt-0.5 text-xs text-muted-foreground">{a.body}</p>}
              <p className="mt-1 text-[10px] text-muted-foreground">de {a.origin} · {a.type} · {a.status}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              {a.status === 'open' && <button onClick={() => setStatus(a.id, 'ack')} title="Marcar visto" className="rounded p-1 hover:bg-muted"><Check className="h-4 w-4 text-cactus-green" /></button>}
              <button onClick={() => setStatus(a.id, 'dismissed')} title="Descartar" className="rounded p-1 hover:bg-muted"><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── Conexiones (dominios + canales) ─────────────────────────────────────────
function ConexionesTab() {
  const [data, setData] = useState<any | null>(null);
  const [domain, setDomain] = useState('');
  const [channelKind, setChannelKind] = useState('whatsapp');
  const load = useCallback(async () => { const r = await fetch('/api/cactus/connections'); setData(await r.json()); }, []);
  useEffect(() => { load(); }, [load]);

  async function addDomain() {
    if (!domain.trim()) return;
    await fetch('/api/cactus/connections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'domain', domain }) });
    setDomain(''); load();
  }
  async function addChannel() {
    await fetch('/api/cactus/connections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'channel', channelKind }) });
    load();
  }
  async function del(kind: string, id: string) {
    await fetch('/api/cactus/connections', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, id }) });
    load();
  }

  if (!data) return <Spinner />;
  const canManage = !!data.canManage;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section>
        <h3 className="mb-2 text-sm font-semibold">Dominios</h3>
        {canManage && (
          <div className="mb-2 flex gap-2">
            <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="midominio.com"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
            <button onClick={addDomain} className="inline-flex items-center gap-1 rounded-lg bg-cactus-green px-3 py-1.5 text-sm font-medium text-white"><Plus className="h-4 w-4" /></button>
          </div>
        )}
        <ul className="space-y-1.5">
          {(data.domains || []).map((d: any) => (
            <li key={d.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5 text-sm">
              <span className="flex-1 truncate">{d.domain}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{d.status}</span>
              {canManage && <button onClick={() => del('domain', d.id)} className="rounded p-1 hover:bg-muted"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>}
            </li>
          ))}
          {(!data.domains || !data.domains.length) && <p className="text-xs text-muted-foreground">Sin dominios.</p>}
        </ul>
      </section>
      <section>
        <h3 className="mb-2 text-sm font-semibold">Canales</h3>
        {canManage && (
          <div className="mb-2 flex gap-2">
            <select value={channelKind} onChange={(e) => setChannelKind(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
              {['whatsapp', 'email', 'slack', 'telegram', 'instagram', 'facebook', 'linkedin'].map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <button onClick={addChannel} className="inline-flex items-center gap-1 rounded-lg bg-cactus-green px-3 py-1.5 text-sm font-medium text-white"><Plus className="h-4 w-4" /></button>
          </div>
        )}
        <ul className="space-y-1.5">
          {(data.channels || []).map((c: any) => (
            <li key={c.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5 text-sm">
              <span className="flex-1 truncate font-medium capitalize">{c.label || c.kind}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{c.status}</span>
              {canManage && <button onClick={() => del('channel', c.id)} className="rounded p-1 hover:bg-muted"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>}
            </li>
          ))}
          {(!data.channels || !data.channels.length) && <p className="text-xs text-muted-foreground">Sin canales.</p>}
        </ul>
      </section>
    </div>
  );
}
