import type { RMBrand } from '../types';

export function buildRamonaSystemPrompt(brand: RMBrand): string {
  const parts: string[] = [];

  parts.push(`Eres Ramona, una asistente creativa de marketing con IA. Eres proactiva, entusiasta y experta en redes sociales.`);
  parts.push(`Tu rol es ayudar al usuario a crear contenido de marketing auténtico y efectivo para su marca.`);
  parts.push(`Respondes siempre en el idioma del usuario.`);

  // Brand context
  parts.push(`\n## Marca: ${brand.name}`);
  if (brand.industry) {
    parts.push(`Industria: ${brand.industry}`);
  }

  // Tone
  if (brand.tone.length > 0) {
    parts.push(`Tono de la marca: ${brand.tone.join(', ')}`);
  }

  // Audience
  if (brand.audience) {
    const aud = brand.audience;
    const audienceDetails: string[] = [];
    if (aud.age_range) audienceDetails.push(`Edad: ${aud.age_range}`);
    if (aud.gender) audienceDetails.push(`Género: ${aud.gender}`);
    if (aud.interests) audienceDetails.push(`Intereses: ${aud.interests}`);
    if (aud.pain_points) audienceDetails.push(`Puntos de dolor: ${aud.pain_points}`);
    if (audienceDetails.length > 0) {
      parts.push(`\nAudiencia objetivo:\n${audienceDetails.join('\n')}`);
    }
  }

  // Value proposition
  if (brand.value_proposition) {
    parts.push(`Propuesta de valor: ${brand.value_proposition}`);
  }

  // Keywords & forbidden words
  if (brand.keywords.length > 0) {
    parts.push(`Palabras clave a usar: ${brand.keywords.join(', ')}`);
  }
  if (brand.forbidden_words.length > 0) {
    parts.push(`Palabras PROHIBIDAS (nunca usar): ${brand.forbidden_words.join(', ')}`);
  }

  // Competitors
  if (brand.competitors.length > 0) {
    parts.push(`Competidores: ${brand.competitors.join(', ')}`);
  }

  // Platforms
  if (brand.platforms.length > 0) {
    parts.push(`Plataformas activas: ${brand.platforms.join(', ')}`);
  }

  // Instructions
  parts.push(`\n## Instrucciones de comportamiento`);
  parts.push(`- Sé proactiva: pregunta por contexto si necesitas más información.`);
  parts.push(`- Sugiere plataformas y tipos de contenido específicos.`);
  parts.push(`- Cuando generes contenido final listo para publicar, marca el inicio con [CONTENT_READY] y el fin con [/CONTENT_READY].`);
  parts.push(`- El contenido marcado debe ser exactamente lo que se publicaría (sin explicaciones dentro del bloque).`);
  parts.push(`- Incluye hashtags relevantes al final del contenido.`);
  parts.push(`- Adapta el largo al formato: Stories cortos, LinkedIn profesional, Twitter/X conciso.`);
  parts.push(`- Si el usuario pide algo que no es marketing, responde amablemente pero guíalo de vuelta a contenido.`);

  return parts.join('\n');
}

export const CONTENT_READY_REGEX = /\[CONTENT_READY\]([\s\S]*?)\[\/CONTENT_READY\]/g;

export function extractReadyContent(text: string): string[] {
  const matches: string[] = [];
  let match;
  while ((match = CONTENT_READY_REGEX.exec(text)) !== null) {
    matches.push(match[1].trim());
  }
  // Reset regex lastIndex
  CONTENT_READY_REGEX.lastIndex = 0;
  return matches;
}
