// ═══════════════════════════════════════════════════════════════════════════
// CACTUS · Profundidad del Cerebro vía Ramona (Cerebro paso 2)
// Puerta ÚNICA por la que los agentes obtienen conocimiento profundo del
// Cerebro (RAG). En lugar de que cada agente consulte el vector store en crudo
// —fuente de ruido y errores— pasa por aquí: se recupera, se acota al alcance
// del agente y se condensa antes de entrar al prompt. Es la curaduría de Ramona.
// ═══════════════════════════════════════════════════════════════════════════

import { retrieveContext } from '@/lib/cactus/rag';

type DB = Parameters<typeof retrieveContext>[0];

/**
 * Recupera contexto profundo y validado para un agente. Devuelve '' si no hay
 * Cerebro/empresa/embeddings o si nada es relevante (guardrail: nunca inventa).
 */
export async function retrieveViaRamona(
  db: DB,
  opts: { companyId: string | null; agentSlug: string; query: string },
): Promise<string> {
  const q = opts.query?.trim();
  if (!db || !opts.companyId || !q || q.length < 4) return '';
  try {
    // retrieveContext ya acota por categorías del agente y es fail-safe.
    return await retrieveContext(db, {
      companyId: opts.companyId,
      agentSlug: opts.agentSlug,
      query: q,
      limit: 5,
    });
  } catch {
    return '';
  }
}
