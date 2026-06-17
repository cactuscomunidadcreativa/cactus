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

export function buildAgentSystemPrompt(slug: string, brandContext?: string): string {
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
${brandContext ? `\nCONTEXTO DE MARCA (úsalo siempre):\n${brandContext}` : ''}`;
}

export function agentGreeting(agent: CactusAgent): string {
  return `Hola, soy ${agent.name} ${agent.emoji} — ${agent.role}. ¿En qué te ayudo?`;
}
