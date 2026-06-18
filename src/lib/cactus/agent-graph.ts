// ═══════════════════════════════════════════════════════════════════════════
// CACTUS — Grafo de agentes (mapa "quién-habla-con-quién")
// Deriva nodos + aristas desde el catálogo maestro. PURO (sin DB, usable en cliente).
// Las aristas salen del campo `tools[]`: cada agente referencia a otros por NOMBRE.
// El layout es radial y determinista: el Núcleo (Cerebro + Ramona) al centro y el
// resto en una elipse, agrupado por división.
// ═══════════════════════════════════════════════════════════════════════════

import { AGENTS, DIVISION_ORDER, type CactusAgent, type DivisionKey } from './agents-catalog';

export type EdgeKind = 'orchestrates' | 'core' | 'handoff';

export interface GraphNode {
  slug: string;
  name: string;
  role: string;
  division: DivisionKey;
  color: string;
  emoji: string;
  image: string;
  status: CactusAgent['status'];
  href: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  kind: EdgeKind;
}

export interface AgentGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  view: { w: number; h: number };
}

// Lienzo lógico del SVG (el componente escala con viewBox).
const VIEW = { w: 1000, h: 720 };
const CX = VIEW.w / 2;
const CY = VIEW.h / 2;
const RX = 410;
const RY = 280;

// Tokens de `tools[]` que NO son agentes pero apuntan a un agente/capacidad del núcleo.
// Las demás herramientas (Meta, Calendar, HubSpot…) son integraciones externas → sin arista.
const TOOL_ALIAS: Record<string, string> = {
  'Brand Kit': 'cactus-ia',
  'Knowledge Vault': 'cactus-ia',
  'RAG': 'cactus-ia',
  'Memoria': 'cactus-ia',
  'Motor Emocional': 'cactus-ia',
  'Tuna CRM': 'tuna',
  'WeekFlow': 'saguaro',
  'Todos los agentes': '*', // especial: Ramona orquesta a todos
};

/** Mapa nombre-de-agente → slug (+ alias de herramientas). */
function buildNameIndex(): Record<string, string> {
  const idx: Record<string, string> = {};
  for (const a of AGENTS) idx[a.name] = a.slug;
  return { ...idx, ...TOOL_ALIAS };
}

function radialLayout(): Record<string, { x: number; y: number }> {
  const pos: Record<string, { x: number; y: number }> = {};
  // Anillo: todos menos el núcleo, agrupados por orden de división.
  const ring = DIVISION_ORDER
    .filter((d) => d !== 'nucleo')
    .flatMap((d) => AGENTS.filter((a) => a.division === d));
  // Redondeo a 2 decimales: el `transform` queda idéntico en server y cliente (sin
  // desajuste de hidratación por precisión flotante de cos/sin).
  const round = (v: number) => Math.round(v * 100) / 100;
  const n = ring.length;
  ring.forEach((a, i) => {
    const ang = -Math.PI / 2 + (i / n) * Math.PI * 2; // arranca arriba, sentido horario
    pos[a.slug] = { x: round(CX + RX * Math.cos(ang)), y: round(CY + RY * Math.sin(ang)) };
  });
  // Núcleo: par central (Cerebro + Ramona) — de aquí irradian orquestación y capacidades.
  pos['cactus-ia'] = { x: CX - 40, y: CY };
  pos['ramona'] = { x: CX + 40, y: CY };
  return pos;
}

/** Construye el grafo (nodos con posición + aristas tipadas). Determinista. */
export function buildAgentGraph(): AgentGraph {
  const nameIdx = buildNameIndex();
  const pos = radialLayout();

  const nodes: GraphNode[] = AGENTS.map((a) => ({
    slug: a.slug,
    name: a.name,
    role: a.role,
    division: a.division,
    color: a.color,
    emoji: a.emoji,
    image: a.image,
    status: a.status,
    href: a.href || `/agent/${a.slug}`,
    x: pos[a.slug]?.x ?? CX,
    y: pos[a.slug]?.y ?? CY,
  }));

  const seen = new Set<string>();
  const edges: GraphEdge[] = [];
  const add = (source: string, target: string, kind: EdgeKind) => {
    if (!source || !target || source === target) return;
    const key = `${source}→${target}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ source, target, kind });
  };

  for (const a of AGENTS) {
    for (const tool of a.tools) {
      const resolved = nameIdx[tool];
      if (!resolved) continue; // integración externa → sin arista
      if (resolved === '*') {
        // Ramona orquesta a todos los demás agentes
        for (const b of AGENTS) if (b.slug !== a.slug) add(a.slug, b.slug, 'orchestrates');
        continue;
      }
      const kind: EdgeKind = resolved === 'cactus-ia' ? 'core' : 'handoff';
      add(a.slug, resolved, kind);
    }
  }

  return { nodes, edges, view: VIEW };
}
