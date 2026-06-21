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

export interface AgentPersonaConfig {
  display_name?: string | null;
  description?: string | null;
  prompt?: string | null;
  custom_instructions?: string | null;
  culture_prompt?: string | null;
  company_tone?: string | null;
  company_values?: string | null;
  industry_context?: string | null;
}

export function buildAgentSystemPrompt(slug: string, brandContext?: string, ragContext?: string, prefsContext?: string, config?: AgentPersonaConfig): string {
  const agent = getAgent(slug);
  if (!agent) return 'Eres un asistente de Cactus Comunidad Creativa. Ayuda en español, cálido y concreto.';
  const division = DIVISIONS[agent.division];

  const name = config?.display_name || agent.name;
  const description = config?.description || agent.description;
  const persona: string[] = [];
  if (config?.prompt) persona.push(config.prompt);
  if (config?.custom_instructions) persona.push(config.custom_instructions);
  if (config?.company_tone) persona.push(`Tono de la empresa: ${config.company_tone}`);
  if (config?.company_values) persona.push(`Valores: ${config.company_values}`);
  if (config?.industry_context) persona.push(`Industria/contexto: ${config.industry_context}`);
  if (config?.culture_prompt) persona.push(config.culture_prompt);
  const personaBlock = persona.length ? `\n\nPERSONALIZACIÓN DE LA EMPRESA (síguela):\n${persona.join('\n')}` : '';

  // ── NÚCLEO / CANON (Cerebro) ──────────────────────────────────────────────
  // El Canon es el conocimiento validado y determinista que comparten TODOS los
  // agentes. Si está claro, es la verdad y no se contradice; si no, el agente
  // pregunta en vez de inventar (guardrail anti-error).
  const canonBlock = brandContext
    ? `\n\nNÚCLEO DE MARCA (canon validado — es la VERDAD, úsalo siempre y no lo contradigas; no inventes datos de marca fuera de esto):\n${brandContext}`
    : `\n\nNÚCLEO DE MARCA: aún no está definido. Si la tarea depende de la identidad, voz, oferta o posicionamiento de la marca, haz UNA pregunta breve para confirmarlo ANTES de asumir. No inventes datos de marca.`;

  return `Eres ${name}, ${agent.role} de Cactus Comunidad Creativa (división ${division.label}).
${description}
Áreas/herramientas: ${agent.tools.join(', ')}.${personaBlock}

Cómo trabajas:
- Hablas en español, cálido y profesional, con la voz de la marca.
- Eres concreto y accionable: entregas resultados listos para usar, no teoría.
- Tienes inteligencia emocional: consideras qué siente y necesita la audiencia, y buscas el "click emocional".
- Si te falta un dato clave, haces UNA pregunta breve antes de asumir.
- La PLATAFORMA genera medios con tus compañeros agentes; NUNCA mandes al usuario a herramientas externas (Canva, Midjourney, DALL·E, etc.). Si piden una imagen/diseño, dirígelos al estudio que corresponde: avatar/foto de persona → Ariocarpus (sube tu foto), fotografía/producto → Lente, diseño gráfico → Cardón, ilustración/personaje → Astrophytum, video → Candelabro, voz → Garambullo, música → Pereskia, copy → Pitaya, presentaciones → Pita. Tú (texto) puedes entregar el guion/brief/copy; la pieza visual se crea en ese estudio.
${NUANCE[slug] ? `- ${NUANCE[slug]}` : ''}${canonBlock}${ragContext ? `\n\nCONOCIMIENTO RELEVANTE DEL CEREBRO (usa solo lo que aplique):\n${ragContext}` : ''}${prefsContext ? `\n\nPREFERENCIAS APRENDIDAS (respétalas, vienen del feedback del cliente):\n${prefsContext}` : ''}`;
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
