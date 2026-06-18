// ═══════════════════════════════════════════════════════════════════════════
// Matriz de scoping de tokens del Cerebro por agente (master spec · 3.3)
// Cada agente solo "ve" sus categorías autorizadas → menos costo, menos riesgo.
// Categorías: brand, product, audience, market, content, ops, sales, finance,
//             legal, people, support.
// ═══════════════════════════════════════════════════════════════════════════

export const ALL_CATEGORIES = [
  'brand', 'product', 'audience', 'market', 'content', 'ops', 'sales', 'finance', 'legal', 'people', 'support',
] as const;
export type KnowledgeCategory = (typeof ALL_CATEGORIES)[number];

const ALL = [...ALL_CATEGORIES] as string[];

export const AGENT_CATEGORIES: Record<string, string[]> = {
  // Maestros: lo ven todo
  'ramona': ALL,
  'cactus-ia': ALL,
  // Especialistas
  'biznaga': ['brand', 'market', 'audience'],
  'pitaya': ['brand', 'product', 'audience', 'content'],
  'pita': ['brand', 'product', 'audience', 'content'],
  'peyote': ['brand', 'audience', 'market', 'content'],
  'nopal': ['brand', 'product', 'audience', 'content'],
  'cholla': ['brand', 'product', 'audience', 'content', 'sales'],
  'cardon': ['brand', 'product', 'content'],
  'lente': ['brand', 'product', 'content'],
  'candelabro': ['brand', 'product', 'content'],
  'sanpedro': ['brand', 'product', 'content'],
  'garambullo': ['brand', 'product', 'content'],
  'pereskia': ['brand', 'product', 'content'],
  'ariocarpus': ['brand', 'product', 'content'],
  'astrophytum': ['brand', 'product', 'content'],
  'opuntia': ['brand', 'product', 'audience', 'content'],
  'echinocereus': ['brand', 'product', 'audience', 'content'],
  'tuna': ['brand', 'product', 'sales', 'audience'],
  'maguey': ['brand', 'product', 'sales', 'audience'],
  'agave': ['finance', 'sales', 'ops', 'product'],
  'ferocactus': ['legal', 'product', 'sales'],
  'huernia': ['legal', 'product', 'sales'],
  'aloe': ['brand', 'product', 'support', 'sales'],
  'ocotillo': ['people', 'ops'],
  'yuca': ['people', 'ops'],
  'cereus': ['brand', 'product', 'content', 'sales'],
  'saguaro': ['ops', 'brand', 'product'],
};

/** Categorías del Cerebro que puede ver un agente (fallback conservador). */
export function categoriesForAgent(slug: string): string[] {
  return AGENT_CATEGORIES[slug] || ['brand', 'product'];
}
