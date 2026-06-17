// ═══════════════════════════════════════════════════════════════════════════
// CACTUS IA · Cerebro — Brand Kit
// El contexto de marca que alimenta a todos los agentes y al motor emocional.
// ═══════════════════════════════════════════════════════════════════════════

export interface BrandKit {
  id?: string;
  name: string;
  industry?: string;
  offer?: string;
  audience?: string;
  tone?: string;
  values?: string[];
  is_active?: boolean;
}

export const EMPTY_BRAND_KIT: BrandKit = {
  name: '', industry: '', offer: '', audience: '', tone: '', values: [], is_active: true,
};

/** Convierte un Brand Kit en contexto de texto para inyectar en prompts de agentes. */
export function buildBrandContext(b?: BrandKit | null): string {
  if (!b || !b.name) return '';
  const parts = [`MARCA: ${b.name}`];
  if (b.industry) parts.push(`INDUSTRIA: ${b.industry}`);
  if (b.offer) parts.push(`OFRECE: ${b.offer}`);
  if (b.audience) parts.push(`AUDIENCIA: ${b.audience}`);
  if (b.tone) parts.push(`TONO DE MARCA: ${b.tone}`);
  if (b.values?.length) parts.push(`VALORES: ${b.values.join(', ')}`);
  return parts.join('\n');
}
