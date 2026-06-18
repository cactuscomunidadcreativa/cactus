'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, ExternalLink, Pencil, Zap, Network, Circle } from 'lucide-react';
import { buildAgentGraph, type EdgeKind } from '@/lib/cactus/agent-graph';
import { DIVISIONS, DIVISION_ORDER, STATUS_LABEL } from '@/lib/cactus/agents-catalog';

interface LiveState {
  isActive: boolean;
  available: boolean;
  image?: string;
  video?: string | null;
  provider?: string | null;
  hasPrompt?: boolean;
  secrets?: number;
  name?: string;
}

const EDGE_STYLE: Record<EdgeKind, { color: string; label: string }> = {
  orchestrates: { color: '#A855C7', label: 'Ramona orquesta' },
  core: { color: '#0D6E4F', label: 'Usa el Cerebro' },
  handoff: { color: '#94A3B8', label: 'Colabora / delega' },
};

export function AgentGraphMap() {
  const graph = useMemo(() => buildAgentGraph(), []);
  const [live, setLive] = useState<Record<string, LiveState> | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [showOrch, setShowOrch] = useState(false);

  useEffect(() => {
    fetch('/api/cactus/agents/overview')
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, LiveState> = {};
        for (const a of (d.agents || [])) map[a.slug] = a;
        setLive(map);
      })
      .catch(() => setLive({}));
  }, []);

  const nodeBySlug = useMemo(() => Object.fromEntries(graph.nodes.map((n) => [n.slug, n])), [graph]);
  const active = hovered || selected;

  // Vecinos del nodo activo (para resaltar) y aristas tocadas
  const { activeEdges, connected } = useMemo(() => {
    const set = new Set<string>();
    const edgeKeys = new Set<string>();
    if (active) {
      for (const e of graph.edges) {
        if (e.source === active || e.target === active) {
          set.add(e.source); set.add(e.target);
          edgeKeys.add(`${e.source}→${e.target}`);
        }
      }
    }
    return { activeEdges: edgeKeys, connected: set };
  }, [active, graph]);

  const edgeVisible = (kind: EdgeKind, source: string, target: string) => {
    const touchesActive = active && (source === active || target === active);
    if (kind === 'orchestrates') return showOrch || touchesActive;
    return true;
  };

  const sel = selected ? nodeBySlug[selected] : null;
  // Mismo criterio que los dots de los nodos: encendido salvo que el estado vivo diga lo contrario.
  const onCount = graph.nodes.filter((n) => (live?.[n.slug]?.isActive ?? true)).length;
  const handoffCount = graph.edges.filter((e) => e.kind !== 'orchestrates').length;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      {/* Lienzo del grafo */}
      <div className="space-y-3">
        {/* Stats + toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <Stat label="Agentes" value={graph.nodes.length} />
          <Stat label="Encendidos" value={onCount} accent />
          <Stat label="Divisiones" value={DIVISION_ORDER.length} />
          <Stat label="Conexiones" value={handoffCount} />
          <button
            onClick={() => setShowOrch((v) => !v)}
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              showOrch ? 'border-[#A855C7] bg-[#A855C7]/10 text-[#A855C7]' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Network className="h-3.5 w-3.5" /> Orquestación de Ramona
          </button>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-[radial-gradient(circle_at_50%_45%,hsl(var(--card)),hsl(var(--muted)))] p-2">
          {!live && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/40 backdrop-blur-[1px]">
              <Loader2 className="h-5 w-5 animate-spin text-cactus-green" />
            </div>
          )}
          <svg viewBox={`0 0 ${graph.view.w} ${graph.view.h}`} className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
            {/* Aristas */}
            <g>
              {graph.edges.map((e) => {
                if (!edgeVisible(e.kind, e.source, e.target)) return null;
                const a = nodeBySlug[e.source]; const b = nodeBySlug[e.target];
                if (!a || !b) return null;
                const isHot = activeEdges.has(`${e.source}→${e.target}`);
                const dim = !!active && !isHot;
                const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                const cx = mx + (graph.view.w / 2 - mx) * 0.3;
                const cy = my + (graph.view.h / 2 - my) * 0.3;
                const col = EDGE_STYLE[e.kind].color;
                return (
                  <path
                    key={`${e.source}-${e.target}`}
                    d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
                    fill="none"
                    stroke={col}
                    strokeWidth={isHot ? 2.4 : 1}
                    strokeOpacity={dim ? 0.06 : isHot ? 0.85 : e.kind === 'orchestrates' ? 0.18 : 0.28}
                    strokeLinecap="round"
                  />
                );
              })}
            </g>

            {/* Nodos */}
            <g>
              {graph.nodes.map((n) => {
                const st = live?.[n.slug];
                const isOn = st ? st.isActive : true;
                const unavailable = st ? st.available === false : false;
                const isActiveNode = active === n.slug;
                const isConnected = connected.has(n.slug);
                const dim = !!active && !isActiveNode && !isConnected;
                const r = n.slug === 'cactus-ia' || n.slug === 'ramona' ? 30 : 24;
                return (
                  <g
                    key={n.slug}
                    transform={`translate(${n.x} ${n.y})`}
                    className="cursor-pointer"
                    opacity={dim ? 0.28 : 1}
                    onMouseEnter={() => setHovered(n.slug)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelected((s) => (s === n.slug ? null : n.slug))}
                  >
                    {isActiveNode && <circle r={r + 7} fill={n.color} opacity={0.14} />}
                    <circle
                      r={r}
                      fill={`${n.color}1f`}
                      stroke={n.color}
                      strokeWidth={isActiveNode ? 3 : 2}
                      strokeDasharray={unavailable ? '4 3' : undefined}
                    />
                    <text textAnchor="middle" dominantBaseline="central" fontSize={r * 0.85} y={1}>
                      {n.emoji}
                    </text>
                    {/* dot de estado encendido/apagado */}
                    <circle cx={r * 0.72} cy={-r * 0.72} r={5} fill={isOn ? '#22C55E' : '#94A3B8'} stroke="white" strokeWidth={1.5} />
                    <text
                      y={r + 14}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={isActiveNode ? 700 : 500}
                      fill="hsl(var(--foreground))"
                    >
                      {n.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-card px-3 py-2 text-[11px]">
          <span className="flex items-center gap-1.5 text-muted-foreground"><Circle className="h-2.5 w-2.5 fill-[#22C55E] text-[#22C55E]" /> Encendido</span>
          <span className="flex items-center gap-1.5 text-muted-foreground"><Circle className="h-2.5 w-2.5 fill-[#94A3B8] text-[#94A3B8]" /> Apagado</span>
          {(Object.keys(EDGE_STYLE) as EdgeKind[]).map((k) => (
            <span key={k} className="flex items-center gap-1.5 text-muted-foreground">
              <span className="inline-block h-0.5 w-4 rounded" style={{ background: EDGE_STYLE[k].color }} /> {EDGE_STYLE[k].label}
            </span>
          ))}
          <span className="ml-auto text-muted-foreground/70">Borde punteado = fuera de tu plan</span>
        </div>
      </div>

      {/* Panel lateral */}
      <aside className="lg:sticky lg:top-4">
        {sel ? (
          <NodePanel slug={sel.slug} graph={graph} live={live} onPick={setSelected} />
        ) : (
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="font-display font-semibold">Mapa del equipo</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Toca un agente para ver su estado y con quién colabora. Pasa el cursor para resaltar sus conexiones.
            </p>
            <div className="mt-4 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Divisiones</p>
              {DIVISION_ORDER.map((d) => (
                <div key={d} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: DIVISIONS[d].color }} />
                  <span className="font-medium">{DIVISIONS[d].label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function NodePanel({
  slug, graph, live, onPick,
}: {
  slug: string;
  graph: ReturnType<typeof buildAgentGraph>;
  live: Record<string, LiveState> | null;
  onPick: (s: string) => void;
}) {
  const node = graph.nodes.find((n) => n.slug === slug)!;
  const st = live?.[slug];
  const isOn = st ? st.isActive : true;
  const unavailable = st ? st.available === false : false;
  const div = DIVISIONS[node.division];

  const out = graph.edges.filter((e) => e.source === slug && e.kind !== 'orchestrates');
  const inc = graph.edges.filter((e) => e.target === slug && e.kind !== 'orchestrates');
  const orchOut = graph.edges.filter((e) => e.source === slug && e.kind === 'orchestrates').length;
  const orchestratedBy = graph.edges.some((e) => e.target === slug && e.kind === 'orchestrates');

  const Chip = ({ s }: { s: string }) => {
    const n = graph.nodes.find((x) => x.slug === s);
    if (!n) return null;
    return (
      <button
        onClick={() => onPick(s)}
        className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs hover:border-cactus-green/40"
      >
        <span>{n.emoji}</span> {n.name}
      </button>
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl" style={{ background: `${node.color}1f` }}>
          {node.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-bold">{st?.name || node.name}</h3>
          <p className="truncate text-xs font-medium" style={{ color: node.color }}>{node.role}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: `${div.color}1a`, color: div.color }}>
          {div.label}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${isOn ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isOn ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`} /> {isOn ? 'Encendido' : 'Apagado'}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          {STATUS_LABEL[node.status]}
        </span>
        {unavailable && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            <Zap className="h-3 w-3" /> Fuera de plan
          </span>
        )}
      </div>

      {orchOut > 0 && (
        <p className="mt-3 rounded-lg bg-[#A855C7]/10 px-2.5 py-1.5 text-xs text-[#7E22CE]">
          🌵 Orquesta a los {orchOut} agentes del equipo.
        </p>
      )}

      {out.length > 0 && (
        <Section title="Colabora con">
          {out.map((e) => <Chip key={e.target} s={e.target} />)}
        </Section>
      )}
      {(inc.length > 0 || orchestratedBy) && (
        <Section title="Lo invocan">
          {orchestratedBy && <Chip s="ramona" />}
          {inc.map((e) => <Chip key={e.source} s={e.source} />)}
        </Section>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href={node.href} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-cactus-green px-3 py-2 text-xs font-semibold text-white hover:bg-cactus-green/90">
          <ExternalLink className="h-3.5 w-3.5" /> Abrir
        </Link>
        <Link href={`/empresa/agentes/${node.slug}`} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-cactus-green/40">
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-1.5 ${accent ? 'border-cactus-green/30 bg-cactus-green/5' : 'border-border bg-card'}`}>
      <span className={`font-display text-lg font-bold ${accent ? 'text-cactus-green' : ''}`}>{value}</span>
      <span className="ml-1.5 text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
