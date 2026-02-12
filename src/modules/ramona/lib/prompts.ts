import type { RMBrand, SocialPlatform, ContentType } from '../types';
import { PLATFORMS } from './platforms';

export function buildSystemPrompt(brand: RMBrand): string {
  const parts: string[] = [];

  parts.push(`Eres un experto en marketing de contenidos para redes sociales.`);
  parts.push(`Generas contenido para la marca "${brand.name}".`);

  if (brand.industry) {
    parts.push(`Industria: ${brand.industry}.`);
  }

  if (brand.tone.length > 0) {
    parts.push(`Tono de comunicación: ${brand.tone.join(', ')}.`);
  }

  if (brand.value_proposition) {
    parts.push(`Propuesta de valor: ${brand.value_proposition}`);
  }

  if (brand.audience) {
    const a = brand.audience;
    const audienceParts: string[] = [];
    if (a.age_range) audienceParts.push(`edad ${a.age_range}`);
    if (a.gender && a.gender !== 'all') audienceParts.push(`género ${a.gender}`);
    if (a.interests) audienceParts.push(`intereses: ${a.interests}`);
    if (a.pain_points) audienceParts.push(`problemas: ${a.pain_points}`);
    if (audienceParts.length > 0) {
      parts.push(`Audiencia objetivo: ${audienceParts.join(', ')}.`);
    }
  }

  if (brand.keywords.length > 0) {
    parts.push(`Palabras clave a incluir cuando sea natural: ${brand.keywords.join(', ')}.`);
  }

  if (brand.forbidden_words.length > 0) {
    parts.push(`NUNCA uses estas palabras: ${brand.forbidden_words.join(', ')}.`);
  }

  if (brand.competitors.length > 0) {
    parts.push(`Competidores (para diferenciarse): ${brand.competitors.join(', ')}.`);
  }

  parts.push(`Responde SOLO con el contenido solicitado, sin explicaciones ni metadatos.`);
  parts.push(`Si se piden hashtags, inclúyelos al final del contenido.`);
  parts.push(`Responde en el idioma del prompt del usuario.`);

  return parts.join('\n');
}

export function buildUserPrompt(params: {
  topic: string;
  platform: SocialPlatform;
  contentType: ContentType;
  includeHashtags?: boolean;
}): string {
  const { topic, platform, contentType, includeHashtags = true } = params;
  const config = PLATFORMS[platform];

  const parts: string[] = [];
  parts.push(`Crea un ${contentType} para ${platform === 'multi' ? 'redes sociales' : platform}.`);
  parts.push(`Tema: ${topic}`);
  parts.push(`Máximo ${config.maxChars} caracteres.`);

  if (contentType === 'carousel') {
    parts.push(`Genera el texto para cada slide separado por "---".`);
  } else if (contentType === 'thread') {
    parts.push(`Genera cada tweet del hilo separado por "---". Máximo 5 tweets.`);
  }

  if (includeHashtags && config.hashtagSupport) {
    parts.push(`Incluye 3-5 hashtags relevantes al final.`);
  }

  return parts.join('\n');
}
