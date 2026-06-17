// ═══════════════════════════════════════════════════════════════════════════
// CRÉDITO CACTUS — modelo de costo/cobro sostenible
// token/imagen/video → costo USD real → créditos (con margen). Para que vender
// IA siempre deje margen y los planes tengan un tope claro y medible.
// ═══════════════════════════════════════════════════════════════════════════

/** 1 Crédito Cactus = este valor en USD de costo IA cubierto (antes de margen). */
export const CREDIT_USD = 0.01;
/** Margen sobre el costo IA (1.6 = 60%). Configurable por negocio. */
export const MARGIN = 1.6;

export interface ModelCost {
  /** USD por 1M tokens de entrada */
  inputPerM?: number;
  /** USD por 1M tokens de salida */
  outputPerM?: number;
  /** USD por imagen generada (modelos de imagen) */
  perImage?: number;
  /** USD por segundo de video (modelos de video) */
  perVideoSec?: number;
}

/** Costos de referencia (USD). Ajustables; idealmente espejo de una tabla DB. */
export const MODEL_COSTS: Record<string, ModelCost> = {
  // texto / razonamiento
  'claude':          { inputPerM: 3, outputPerM: 15 },
  'claude-haiku':    { inputPerM: 0.8, outputPerM: 4 },
  'gpt':             { inputPerM: 2.5, outputPerM: 10 },
  'gpt-mini':        { inputPerM: 0.15, outputPerM: 0.6 },
  'gemini':          { inputPerM: 1.25, outputPerM: 5 },
  // imagen
  'gpt-image':       { perImage: 0.04 },
  'midjourney':      { perImage: 0.05 },
  'firefly':         { perImage: 0.04 },
  // video (aprox por segundo)
  'kling':           { perVideoSec: 0.10 },
  'runway':          { perVideoSec: 0.12 },
  'veo':             { perVideoSec: 0.20 },
};

const DEFAULT_TEXT: ModelCost = { inputPerM: 3, outputPerM: 15 };

/** Costo IA real (USD) de una operación. */
export function estimateCostUsd(params: {
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  images?: number;
  videoSeconds?: number;
}): number {
  const c = MODEL_COSTS[params.model || 'claude'] || DEFAULT_TEXT;
  let usd = 0;
  if (c.inputPerM && params.inputTokens) usd += (params.inputTokens / 1_000_000) * c.inputPerM;
  if (c.outputPerM && params.outputTokens) usd += (params.outputTokens / 1_000_000) * c.outputPerM;
  if (c.perImage && params.images) usd += c.perImage * params.images;
  if (c.perVideoSec && params.videoSeconds) usd += c.perVideoSec * params.videoSeconds;
  return usd;
}

/** Créditos a cobrar al cliente por un costo IA dado (incluye margen). */
export function usdToCredits(costUsd: number): number {
  return Math.max(1, Math.ceil((costUsd * MARGIN) / CREDIT_USD));
}

/** Créditos incluidos por plan/mes (espejo de app_tiers.limits). Ejemplo ajustable. */
export const PLAN_CREDITS: Record<string, number> = {
  starter: 5_000,
  business: 15_000,
  agency: 30_000,
  moda: 30_000,
  avatar: 30_000,
  full: -1, // ilimitado / BYOK
};
