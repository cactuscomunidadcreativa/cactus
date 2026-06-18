// ═══════════════════════════════════════════════════════════════════════════
// Prompts de agente — genera el system prompt de cualquier cactus desde el
// catálogo + el contexto de marca. Inteligencia emocional integrada.
// ═══════════════════════════════════════════════════════════════════════════

import { getAgent, DIVISIONS, type CactusAgent } from './agents-catalog';

/** Matices específicos por agente (encima del prompt base generado). */
const NUANCE: Record<string, string> = {
  saguaro: 'Devuelve procesos como checklists numerados y SOPs accionables.',
  biznaga: 'Estructura: panorama, competencia, tendencias, oportunidades. Sé específico y honesto sobre lo que no sabes.',
  ferocactus: 'Redacta documentos claros (cotización/contrato/términos). Marca con [REVISAR CON ABOGADO] lo que requiera validación legal.',
  maguey: 'Da scripts de venta, manejo de objeciones y próximos pasos concretos para cerrar.',
  echinocereus: 'Entrega keywords, estructura de contenidos, metadatos y acciones de SEO priorizadas.',
  ocotillo: 'Ayuda con perfiles, preguntas de entrevista, criterios y shortlists.',
  yuca: 'Enfócate en metas, hábitos, foco y bienestar; propón rutinas medibles.',
  huernia: 'Prepara políticas y alertas de riesgo; NO reemplazas a un abogado, lo dejas claro.',
  aloe: 'Responde como atención al cliente: empático, resolutivo, con tono de marca.',
  lente: 'Entrega dirección fotográfica: shotlist, moodboard descrito, encuadres, luz y estilo.',
  candelabro: 'Entrega guion/storyboard de video (escenas, duración, texto en pantalla, música sugerida).',
  sanpedro: 'Describe la animación: estilo, ritmo, transiciones, momentos clave.',
  garambullo: 'Escribe el guion de locución listo para grabar, con tono e indicaciones de voz.',
  pereskia: 'Describe el brief musical: género, mood, instrumentos, tempo, referencias.',
  ariocarpus: 'Diseña la ficha del avatar/influencer: rostro, voz, personalidad, historia, reglas de consistencia.',
  astrophytum: 'Diseña el personaje/mascota: rasgos, paleta, personalidad, story bible.',
  opuntia: 'Propón estructura del sitio/landing (secciones, copy por bloque, CTA, funnel).',
};

export function buildAgentSystemPrompt(slug: string, brandContext?: string, ragContext?: string): string {
  const agent = getAgent(slug);
  if (!agent) return 'Eres un asistente de Cactus Comunidad Creativa. Ayuda en español, cálido y concreto.';
  const division = DIVISIONS[agent.division];

  return `Eres ${agent.name}, ${agent.role} de Cactus Comunidad Creativa (división ${division.label}).
${agent.description}
Áreas/herramientas: ${agent.tools.join(', ')}.

Cómo trabajas:
- Hablas en español, cálido y profesional, con la voz de la marca.
- Eres concreto y accionable: entregas resultados listos para usar, no teoría.
- Tienes inteligencia emocional: consideras qué siente y necesita la audiencia, y buscas el "click emocional".
- Si te falta un dato clave, haces UNA pregunta breve antes de asumir.
${NUANCE[slug] ? `- ${NUANCE[slug]}` : ''}
${brandContext ? `\nCONTEXTO DE MARCA (úsalo siempre):\n${brandContext}` : ''}${ragContext ? `\n\nCONOCIMIENTO RELEVANTE DEL CEREBRO (usa solo lo que aplique):\n${ragContext}` : ''}`;
}

export function agentGreeting(agent: CactusAgent): string {
  return `Hola, soy ${agent.name} ${agent.emoji} — ${agent.role}. ¿En qué te ayudo?`;
}

/** Acciones rápidas por agente — chips para arrancar sin pensar el prompt. */
const QUICK_ACTIONS: Record<string, string[]> = {
  biznaga: ['Benchmark de mi competencia', 'Tendencias de mi industria', '3 oportunidades de mercado'],
  ferocactus: ['Hazme una cotización', 'Borrador de contrato de servicio', 'Términos y condiciones'],
  maguey: ['Dame un script de venta', 'Maneja la objeción de precio', 'Secuencia de seguimiento'],
  echinocereus: ['Keywords para mi negocio', 'Estructura SEO de una landing', 'Plan de contenidos'],
  ocotillo: ['Perfil de puesto', 'Preguntas de entrevista', 'Criterios de evaluación'],
  yuca: ['Plan de hábitos semanal', 'Rutina de foco', 'Metas del trimestre'],
  huernia: ['Política de privacidad base', 'Riesgos de mi operación', 'Checklist de compliance'],
  aloe: ['Responde un reclamo', 'FAQ de mi producto', 'Mensaje de bienvenida'],
  candelabro: ['Storyboard de un reel', 'Guion de comercial de 30s', 'Ideas de video viral'],
  sanpedro: ['Concepto de intro animada', 'Estilo de motion para mi marca'],
  pereskia: ['Brief musical para un reel', 'Jingle para mi marca'],
  ariocarpus: ['Ficha de embajador virtual', 'Define la personalidad de mi avatar'],
  opuntia: ['Estructura de una landing', 'Copy por sección de mi web'],
};

export function agentQuickActions(slug: string): string[] {
  if (QUICK_ACTIONS[slug]) return QUICK_ACTIONS[slug];
  const a = getAgent(slug);
  if (!a) return [];
  return [`Ayúdame con ${a.role.toLowerCase()}`, `¿Qué puedes hacer por mi marca?`];
}
