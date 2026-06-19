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
  agave: [
    { key: 'precios', name: 'Estratega de precios', role: 'Márgenes y pricing', focus: 'Enfócate en márgenes, escenarios de precio y rentabilidad.' },
    { key: 'analisis', name: 'Analista', role: 'Lectura de datos', focus: 'Interpreta los números y traduce a decisiones claras.' },
    { key: 'reporte', name: 'Reportero', role: 'Resúmenes ejecutivos', focus: 'Condensa el panorama en un resumen ejecutivo accionable.' },
  ],
  tuna: [
    { key: 'pipeline', name: 'Gestor de pipeline', role: 'Oportunidades', focus: 'Prioriza oportunidades y próximos pasos del embudo.' },
    { key: 'seguimiento', name: 'Seguimiento', role: 'Cadencias', focus: 'Diseña mensajes y cadencias de seguimiento que cierran.' },
    { key: 'forecast', name: 'Forecaster', role: 'Proyección', focus: 'Estima ingresos esperados con supuestos explícitos y honestos.' },
  ],
  ferocactus: [
    { key: 'cotizacion', name: 'Cotizador', role: 'Propuestas y precios', focus: 'Arma cotizaciones claras con alcance, precio y condiciones.' },
    { key: 'contrato', name: 'Redactor de contratos', role: 'Documentos legales', focus: 'Redacta contratos y cláusulas claras y equilibradas.' },
    { key: 'revisor', name: 'Revisor', role: 'Riesgos del documento', focus: 'Revisa documentos y señala riesgos y vacíos.' },
  ],
  cholla: [
    { key: 'planmedios', name: 'Planificador de medios', role: 'Presupuesto y canales', focus: 'Distribuye presupuesto entre canales según objetivo.' },
    { key: 'creatividades', name: 'Creatividades', role: 'Variantes de anuncio', focus: 'Genera variantes de anuncio para testear.' },
    { key: 'optimizador', name: 'Optimizador', role: 'Performance', focus: 'Propón ajustes para mejorar CTR/CPA con criterio honesto.' },
  ],
  pitaya: [
    { key: 'gancho', name: 'Cazador de ganchos', role: 'Hooks', focus: 'Crea hooks y aperturas irresistibles.' },
    { key: 'largo', name: 'Long-form', role: 'Textos extensos', focus: 'Desarrolla piezas largas con estructura y ritmo.' },
    { key: 'editor', name: 'Editor', role: 'Pulido', focus: 'Recorta, afila y mejora claridad y tono.' },
  ],
  cardon: [
    { key: 'concepto', name: 'Conceptual', role: 'Dirección visual', focus: 'Propón conceptos y dirección de arte para la pieza.' },
    { key: 'brief', name: 'Brief de diseño', role: 'Especificaciones', focus: 'Traduce la idea en un brief de diseño accionable.' },
    { key: 'sistema', name: 'Sistema visual', role: 'Consistencia', focus: 'Define guías de marca y consistencia visual.' },
  ],
  lente: [
    { key: 'prompt', name: 'Prompt de foto', role: 'Generación', focus: 'Escribe prompts visuales detallados para imagen.' },
    { key: 'estilo', name: 'Director de estilo', role: 'Look & feel', focus: 'Define luz, encuadre y estilo coherente con la marca.' },
    { key: 'serie', name: 'Serie', role: 'Sets coherentes', focus: 'Crea sets de imágenes consistentes entre sí.' },
  ],
  candelabro: [
    { key: 'guion', name: 'Guionista', role: 'Scripts', focus: 'Escribe guiones de video con estructura y gancho.' },
    { key: 'storyboard', name: 'Storyboard', role: 'Plano a plano', focus: 'Desglosa el video en planos y tomas.' },
    { key: 'corto', name: 'Reel/Short', role: 'Formato vertical', focus: 'Adapta a formato corto vertical con ritmo rápido.' },
  ],
  sanpedro: [
    { key: 'concepto', name: 'Conceptual', role: 'Idea de animación', focus: 'Propón conceptos de animación y motion.' },
    { key: 'timing', name: 'Timing', role: 'Ritmo y tiempos', focus: 'Define tiempos, transiciones y ritmo del motion.' },
    { key: 'estilo', name: 'Estilo', role: 'Look de motion', focus: 'Define el estilo visual del motion acorde a la marca.' },
  ],
  garambullo: [
    { key: 'guion', name: 'Guion de voz', role: 'Locución', focus: 'Escribe guiones para locución natural y clara.' },
    { key: 'tono', name: 'Director de tono', role: 'Voz y emoción', focus: 'Define el tono, ritmo y emoción de la voz.' },
    { key: 'podcast', name: 'Podcast', role: 'Formato audio largo', focus: 'Estructura episodios y segmentos de audio.' },
  ],
  pereskia: [
    { key: 'brief', name: 'Brief musical', role: 'Dirección', focus: 'Define género, mood y referencias musicales.' },
    { key: 'jingle', name: 'Jingle', role: 'Marca sonora', focus: 'Crea conceptos de jingle e identidad sonora.' },
    { key: 'sync', name: 'Sync', role: 'Música para video', focus: 'Propón música que sincronice con la pieza audiovisual.' },
  ],
  ariocarpus: [
    { key: 'persona', name: 'Personalidad', role: 'Carácter del avatar', focus: 'Define la personalidad y voz del avatar.' },
    { key: 'guion', name: 'Guion de avatar', role: 'Diálogos', focus: 'Escribe diálogos y respuestas en personaje.' },
    { key: 'ficha', name: 'Ficha técnica', role: 'Especificación', focus: 'Documenta la ficha del humano digital.' },
  ],
  astrophytum: [
    { key: 'concepto', name: 'Concepto', role: 'Diseño de personaje', focus: 'Propón conceptos y arquetipos de personaje.' },
    { key: 'lore', name: 'Lore', role: 'Historia y mundo', focus: 'Construye la historia y el mundo del personaje.' },
    { key: 'ficha', name: 'Ficha', role: 'Atributos', focus: 'Define atributos, estilo y guía del personaje.' },
  ],
  opuntia: [
    { key: 'estructura', name: 'Arquitecto web', role: 'Estructura', focus: 'Diseña la estructura y secciones del sitio.' },
    { key: 'copyweb', name: 'Copy web', role: 'Textos por sección', focus: 'Escribe copy por sección orientado a conversión.' },
    { key: 'conversion', name: 'Conversión', role: 'CTAs y flujo', focus: 'Optimiza CTAs y el flujo hacia la conversión.' },
  ],
  echinocereus: [
    { key: 'keywords', name: 'Keywords', role: 'Investigación', focus: 'Identifica keywords y oportunidades de búsqueda.' },
    { key: 'contenido', name: 'Plan de contenido', role: 'SEO editorial', focus: 'Arma un plan de contenidos SEO por intención.' },
    { key: 'tecnico', name: 'SEO técnico', role: 'On-page', focus: 'Revisa estructura on-page y mejoras técnicas.' },
  ],
  maguey: [
    { key: 'script', name: 'Script de venta', role: 'Discurso', focus: 'Escribe scripts de venta persuasivos y honestos.' },
    { key: 'objeciones', name: 'Manejo de objeciones', role: 'Respuestas', focus: 'Prepara respuestas a objeciones frecuentes.' },
    { key: 'propuesta', name: 'Propuesta', role: 'Cierre', focus: 'Estructura propuestas comerciales que cierran.' },
  ],
  aloe: [
    { key: 'respuesta', name: 'Respuesta de soporte', role: 'Atención', focus: 'Redacta respuestas claras y empáticas a clientes.' },
    { key: 'faq', name: 'FAQ', role: 'Autoservicio', focus: 'Crea FAQs y artículos de ayuda.' },
    { key: 'reclamo', name: 'Manejo de reclamos', role: 'Desescalada', focus: 'Maneja reclamos con tono que desescala.' },
  ],
  ocotillo: [
    { key: 'perfil', name: 'Perfil de puesto', role: 'Job description', focus: 'Redacta perfiles de puesto claros y atractivos.' },
    { key: 'entrevista', name: 'Entrevista', role: 'Preguntas', focus: 'Diseña preguntas y criterios de entrevista.' },
    { key: 'evaluacion', name: 'Evaluación', role: 'Scorecards', focus: 'Crea rúbricas de evaluación de candidatos.' },
  ],
  yuca: [
    { key: 'habitos', name: 'Coach de hábitos', role: 'Rutinas', focus: 'Diseña hábitos y rutinas sostenibles.' },
    { key: 'foco', name: 'Foco', role: 'Productividad', focus: 'Propón sistemas de foco y gestión del tiempo.' },
    { key: 'metas', name: 'Metas', role: 'Objetivos', focus: 'Estructura metas claras con seguimiento.' },
  ],
  huernia: [
    { key: 'politica', name: 'Políticas', role: 'Documentos base', focus: 'Redacta políticas (privacidad, términos) base.' },
    { key: 'riesgos', name: 'Riesgos', role: 'Compliance', focus: 'Identifica riesgos legales y de cumplimiento.' },
    { key: 'checklist', name: 'Checklist', role: 'Verificación', focus: 'Arma checklists de cumplimiento accionables.' },
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
