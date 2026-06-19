// ═══════════════════════════════════════════════════════════════════════════
// CACTUS · Control de gasto (Bloque 5)
// El usuario elige un perfil de presupuesto; la plataforma selecciona el modelo
// de IA acorde (barato vs caro) sin que el usuario tenga que saber de modelos.
// La preferencia viaja en una cookie -> el router de IA la lee en el server y
// aplica a TODOS los agentes sin tocar su código.
// ═══════════════════════════════════════════════════════════════════════════

import type { AIProvider } from '@/lib/ai/types';

export type BudgetTier = 'economico' | 'equilibrado' | 'maxima';

export const BUDGET_COOKIE = 'cactus_budget';
export const DEFAULT_TIER: BudgetTier = 'equilibrado';

export interface TierMeta {
  key: BudgetTier;
  label: string;
  desc: string;
  /** descripción relativa de costo para la UI */
  costHint: string;
  emoji: string;
}

export const BUDGET_TIERS: TierMeta[] = [
  { key: 'economico', label: 'Económico', emoji: '🌱', desc: 'Modelos rápidos y baratos. Ideal para borradores y alto volumen.', costHint: 'Menor costo' },
  { key: 'equilibrado', label: 'Equilibrado', emoji: '⚖️', desc: 'Balance entre calidad y costo para el día a día.', costHint: 'Costo medio' },
  { key: 'maxima', label: 'Máxima calidad', emoji: '💎', desc: 'Los modelos más capaces para piezas finales y trabajo crítico.', costHint: 'Mayor costo' },
];

/** Modelo concreto por proveedor según el perfil de presupuesto. */
const MODEL_MATRIX: Record<AIProvider, Record<BudgetTier, string>> = {
  claude: {
    economico: 'claude-3-5-haiku-20241022',
    equilibrado: 'claude-sonnet-4-20250514',
    maxima: 'claude-opus-4-20250514',
  },
  openai: {
    economico: 'gpt-4o-mini',
    equilibrado: 'gpt-4o',
    maxima: 'gpt-4o',
  },
  gemini: {
    economico: 'gemini-2.0-flash',
    equilibrado: 'gemini-2.0-flash',
    maxima: 'gemini-1.5-pro',
  },
};

export function isBudgetTier(v: unknown): v is BudgetTier {
  return v === 'economico' || v === 'equilibrado' || v === 'maxima';
}

/** Devuelve el id de modelo para un proveedor y perfil; null si no hay override. */
export function modelForTier(provider: AIProvider, tier: BudgetTier | undefined): string | null {
  if (!tier) return null;
  return MODEL_MATRIX[provider]?.[tier] ?? null;
}
