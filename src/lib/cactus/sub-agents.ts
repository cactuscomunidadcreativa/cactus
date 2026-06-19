// ═══════════════════════════════════════════════════════════════════════════
// CACTUS · Mini-agentes / sub-agentes especializados (Bloque 6)
// Cada agente principal tiene sub-agentes que enfocan su trabajo en una
// especialidad. No son modelos distintos: son "modos" que reorientan el system
// prompt del agente. Cero tablas nuevas; el route inyecta la directiva.
// ═══════════════════════════════════════════════════════════════════════════

export interface SubAgent {
  key: string;
  name: string;
  /** una línea para la UI */
  role: string;
  /** directiva que se añade al system prompt del agente */
  focus: string;
}

const GENERIC: SubAgent[] = [
  { key: 'rapido', name: 'Borrador rápido', role: 'Primera versión veloz', focus: 'Prioriza velocidad: entrega un primer borrador conciso y accionable, sin sobre-pulir.' },
  { key: 'pulido', name: 'Pulidor', role: 'Calidad final', focus: 'Eleva la pieza a calidad de publicación: claridad, tono de marca y detalle impecable.' },
  { key: 'estratega', name: 'Estratega', role: 'Visión y porqués', focus: 'Antes de ejecutar, explica el razonamiento estratégico y propone el mejor enfoque.' },
];

const CATALOG: Record<string, SubAgent[]> = {
  saguaro: [
    { key: 'disenador', name: 'Diseñador de flujos', role: 'Estructura procesos', focus: 'Especialízate en descomponer objetivos en pasos claros, responsables y dependencias.' },
    { key: 'optimizador', name: 'Optimizador', role: 'Quita cuellos de botella', focus: 'Detecta cuellos de botella, pasos redundantes y oportunidades de automatización.' },
    { key: 'auditor', name: 'Auditor', role: 'Cumplimiento y control', focus: 'Revisa que cada flujo tenga controles, aprobaciones y trazabilidad adecuados.' },
  ],
  peyote: [
    { key: 'angulos', name: 'Generador de ángulos', role: 'Ideas y enfoques', focus: 'Genera múltiples ángulos creativos y emocionales para una misma idea.' },
    { key: 'critico', name: 'Crítico emocional', role: 'Audita el "click"', focus: 'Evalúa con dureza si el mensaje realmente gatilla la emoción objetivo y por qué.' },
    { key: 'adaptador', name: 'Adaptador de canal', role: 'Ajuste por plataforma', focus: 'Adapta el mismo mensaje al formato y ritmo de cada canal (IG, TikTok, email…).' },
  ],
  cereus: [
    { key: 'copy', name: 'Copywriter de producto', role: 'Fichas que venden', focus: 'Escribe descripciones de producto persuasivas y optimizadas para e-commerce.' },
    { key: 'naming', name: 'Naming de colección', role: 'Nombres y narrativa', focus: 'Crea nombres y narrativas memorables para colecciones y líneas de producto.' },
    { key: 'editor', name: 'Editor de tono', role: 'Voz editorial', focus: 'Refina el tono editorial y la coherencia de marca en cada pieza.' },
  ],
  biznaga: [
    { key: 'competencia', name: 'Analista de competencia', role: 'Quién y cómo', focus: 'Enfócate en mapear competidores, su posicionamiento y sus movimientos.' },
    { key: 'tendencias', name: 'Cazador de tendencias', role: 'Qué viene', focus: 'Identifica señales y tendencias emergentes relevantes para el negocio.' },
    { key: 'benchmark', name: 'Benchmarker', role: 'Métricas de referencia', focus: 'Aporta benchmarks y métricas de referencia comparables y realistas.' },
  ],
  nopal: [
    { key: 'calendario', name: 'Planificador', role: 'Calendario editorial', focus: 'Organiza un calendario de contenidos coherente y sostenible.' },
    { key: 'copy', name: 'Copy social', role: 'Captions y hooks', focus: 'Escribe captions con hooks fuertes y CTA claros por red social.' },
    { key: 'comunidad', name: 'Community', role: 'Conversación', focus: 'Propón respuestas y dinámicas para activar y cuidar a la comunidad.' },
  ],
};

export function getSubAgents(slug: string): SubAgent[] {
  return CATALOG[slug] || GENERIC;
}

/** Devuelve la directiva del sub-agente para anexar al system prompt, o '' si no aplica. */
export function subAgentDirective(slug: string, key?: string | null): string {
  if (!key) return '';
  const sub = getSubAgents(slug).find((s) => s.key === key);
  if (!sub) return '';
  return `\n\nMODO ESPECIALIZADO ACTIVO — ${sub.name} (${sub.role}):\n${sub.focus}`;
}
