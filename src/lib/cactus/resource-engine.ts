// ═══════════════════════════════════════════════════════════════════════════
// Motor de recursos (Fase D) — antes de gastar IA decide: caché vs generar, y
// con qué nivel (ahorro=barato, calidad=premium). Caché de respuestas repetidas
// (porte de EGO RespuestaCache) = costo 0. Resiliente; nunca lanza.
// ═══════════════════════════════════════════════════════════════════════════
import type { AIProvider } from '@/lib/ai/types';

type DB = any;
export type AiMode = 'ahorro' | 'equilibrio' | 'calidad';

/** Modo de IA de la empresa (companies.ai_mode). */
export async function resolveMode(db: DB, companyId: string | null): Promise<AiMode> {
  if (!db || !companyId) return 'equilibrio';
  try {
    const { data } = await db.from('companies').select('ai_mode').eq('id', companyId).maybeSingle();
    const m = data?.ai_mode;
    return m === 'ahorro' || m === 'calidad' ? m : 'equilibrio';
  } catch {
    return 'equilibrio';
  }
}

/** Proveedor preferido y factor de longitud según el modo. */
export function planForMode(mode: AiMode): { provider?: AIProvider; maxTokensFactor: number } {
  if (mode === 'ahorro') return { provider: 'openai', maxTokensFactor: 0.6 };   // gpt-4o-mini, más corto
  if (mode === 'calidad') return { provider: 'claude', maxTokensFactor: 1.3 };  // premium, más largo
  return { provider: undefined, maxTokensFactor: 1 };                            // equilibrio = default
}

/** Hash estable y barato de la entrada (djb2). */
export function hashKey(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return `${h.toString(36)}:${s.length}`;
}

/** Busca en caché (incrementa hits best-effort). null si no hay. */
export async function getCached(db: DB, companyId: string | null, hash: string): Promise<{ content: string; model: string | null } | null> {
  if (!db || !companyId) return null;
  try {
    const { data } = await db.from('response_cache').select('id, content, model, hits')
      .eq('company_id', companyId).eq('prompt_hash', hash).maybeSingle();
    if (!data) return null;
    db.from('response_cache').update({ hits: (data.hits || 0) + 1 }).eq('id', data.id).then(() => {}, () => {});
    return { content: data.content, model: data.model };
  } catch {
    return null;
  }
}

/** Guarda en caché (upsert por company+hash). */
export async function setCached(db: DB, companyId: string | null, hash: string, content: string, model: string | null, agentSlug?: string): Promise<void> {
  if (!db || !companyId || !content) return;
  try {
    await db.from('response_cache').upsert(
      { company_id: companyId, prompt_hash: hash, content, model, agent_slug: agentSlug || null },
      { onConflict: 'company_id,prompt_hash' },
    );
  } catch {
    /* noop */
  }
}
