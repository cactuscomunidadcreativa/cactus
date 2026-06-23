// ═══════════════════════════════════════════════════════════════════════════
// Ejecución híbrida del plan de Ramona.
// Automática, pero PAUSA para pedir tu OK en pasos sensibles:
//   · outward → publican / envían algo al exterior
//   · expensive → generan medios caros (video, música, avatares)
//   · o la acción menciona publicar/enviar/lanzar.
// ═══════════════════════════════════════════════════════════════════════════
import { getAgent } from './agents-catalog';

const OUTWARD = new Set(['nopal', 'aloe', 'maguey']);
const EXPENSIVE = new Set(['candelabro', 'sanpedro', 'pereskia', 'ariocarpus']);
const SENSITIVE_WORDS = /(public|publicar|publicaci|env[ií]a|enviar|env[ií]o|lanza|lanzar|lanzamiento|difund|programa(r)? post|agenda(r)? post|pauta|ad spend|presupuesto)/i;

export function isSensitive(agentSlug: string, action: string): boolean {
  return OUTWARD.has(agentSlug) || EXPENSIVE.has(agentSlug) || SENSITIVE_WORDS.test(action || '');
}

export function sensitiveReason(agentSlug: string, action: string): string {
  if (OUTWARD.has(agentSlug) || SENSITIVE_WORDS.test(action || '')) return 'Publica o envía algo al exterior';
  if (EXPENSIVE.has(agentSlug)) return 'Genera medios de mayor costo';
  return 'Paso sensible';
}

export function deliverableKind(agentSlug: string): string {
  // Honestidad: el orquestador NO renderiza video/música reales (eso es Fase F /
  // los estudios dedicados). Para estos agentes entrega el GUIÓN/brief como 'doc',
  // en vez de etiquetar 'video'/'audio' un entregable que en realidad es texto.
  if (['candelabro', 'sanpedro'].includes(agentSlug)) return 'doc';   // guión de video
  if (['garambullo', 'pereskia'].includes(agentSlug)) return 'doc';   // brief/letra de audio
  if (['cardon', 'lente', 'astrophytum', 'ariocarpus'].includes(agentSlug)) return 'image';
  if (agentSlug === 'pita') return 'deck';
  if (getAgent(agentSlug)?.division === 'business') return 'data';
  return 'doc';
}

export function agentTaskPrompt(params: { action: string; objective?: string | null }): string {
  return `${params.objective ? `Objetivo del proyecto: ${params.objective}\n\n` : ''}Tu tarea concreta para este proyecto: ${params.action}

Entrega el resultado listo para usar — claro, accionable y bien estructurado. No expliques que eres una IA ni pidas más contexto: trabaja con lo que hay y produce el entregable.`;
}
