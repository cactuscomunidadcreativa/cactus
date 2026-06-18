// ═══════════════════════════════════════════════════════════════════════════
// Cerebro RAG (Fase B) — ingesta (chunk + embed + store) y recuperación scopeada.
// Resiliente: sin key de embeddings, indexa sin vector y recupera por texto.
// El acceso a datos nunca lanza (degrada a vacío).
// ═══════════════════════════════════════════════════════════════════════════
import { embed, embedBatch, toVectorLiteral } from '@/lib/ai/embeddings';
import { categoriesForAgent } from './knowledge-scope';

type DB = any;

/** Parte un texto en chunks de ~900 chars con solape de ~120 (por párrafos). */
export function chunkText(text: string, size = 900, overlap = 120): string[] {
  const clean = (text || '').replace(/\s+\n/g, '\n').trim();
  if (!clean) return [];
  if (clean.length <= size) return [clean];
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    let end = Math.min(i + size, clean.length);
    // intenta cortar en un salto de párrafo/oración cercano
    if (end < clean.length) {
      const slice = clean.slice(i, end);
      const cut = Math.max(slice.lastIndexOf('\n\n'), slice.lastIndexOf('. '), slice.lastIndexOf('\n'));
      if (cut > size * 0.5) end = i + cut + 1;
    }
    chunks.push(clean.slice(i, end).trim());
    if (end >= clean.length) break;
    i = end - overlap;
  }
  return chunks.filter(Boolean);
}

const estTokens = (s: string) => Math.ceil(s.length / 4);

async function insertChunks(
  db: DB,
  base: { companyId: string; itemId: string | null; brandId: string | null; source: string; category: string },
  texts: string[],
): Promise<number> {
  const embs = await embedBatch(texts);
  let n = 0;
  for (let k = 0; k < texts.length; k++) {
    const e = embs[k];
    try {
      const { error } = await db.rpc('cactus_insert_chunk', {
        p_company: base.companyId, p_item: base.itemId, p_brand: base.brandId,
        p_source: base.source, p_category: base.category,
        p_content: texts[k], p_tokens: estTokens(texts[k]),
        p_embedding: e ? toVectorLiteral(e) : '',
      });
      if (!error) n++;
    } catch { /* noop */ }
  }
  return n;
}

function brandKitText(b: any): string {
  if (!b) return '';
  const parts = [`Marca: ${b.name}`];
  if (b.industry) parts.push(`Industria: ${b.industry}`);
  if (b.offer) parts.push(`Oferta: ${b.offer}`);
  if (b.audience) parts.push(`Audiencia: ${b.audience}`);
  if (b.tone) parts.push(`Tono: ${b.tone}`);
  if (b.values?.length) parts.push(`Valores: ${(b.values || []).join(', ')}`);
  return parts.join('\n');
}

/** Reindexa TODO el Cerebro de una empresa (brand kits + knowledge items). */
export async function reindexCompany(db: DB, companyId: string): Promise<{ ok: boolean; chunks: number; embedded: boolean }> {
  if (!db || !companyId) return { ok: false, chunks: 0, embedded: false };
  try {
    // Borra los chunks previos de la empresa
    await db.from('knowledge_chunks').delete().eq('company_id', companyId);
    let total = 0;

    // Brand kits de la empresa → categoría 'brand'
    const { data: brands } = await db.from('cactus_brand_kits').select('*').eq('company_id', companyId);
    for (const b of (brands || [])) {
      const txt = brandKitText(b);
      if (txt) total += await insertChunks(db, { companyId, itemId: null, brandId: b.id, source: 'brand', category: 'brand' }, chunkText(txt));
    }

    // Knowledge items de la empresa → su categoría
    const { data: items } = await db.from('cactus_knowledge_items').select('*').eq('company_id', companyId);
    for (const it of (items || [])) {
      const txt = [it.title, it.content].filter(Boolean).join('\n');
      if (txt) total += await insertChunks(db, { companyId, itemId: it.id, brandId: it.brand_kit_id || null, source: it.kind || 'note', category: it.category || 'brand' }, chunkText(txt));
    }

    const probe = await embed('probe');
    return { ok: true, chunks: total, embedded: probe !== null };
  } catch {
    return { ok: false, chunks: 0, embedded: false };
  }
}

/** Indexa un único knowledge item (al crearlo/editarlo). */
export async function indexKnowledgeItem(db: DB, companyId: string, item: { id: string; title?: string; content?: string; kind?: string; category?: string; brand_kit_id?: string | null }): Promise<number> {
  if (!db || !companyId || !item?.id) return 0;
  try {
    await db.from('knowledge_chunks').delete().eq('knowledge_item_id', item.id);
    const txt = [item.title, item.content].filter(Boolean).join('\n');
    if (!txt) return 0;
    return await insertChunks(db, { companyId, itemId: item.id, brandId: item.brand_kit_id || null, source: item.kind || 'note', category: item.category || 'brand' }, chunkText(txt));
  } catch {
    return 0;
  }
}

/** Recupera contexto del Cerebro scopeado por el agente (vector → fallback texto). */
export async function retrieveContext(
  db: DB,
  opts: { companyId: string | null; agentSlug: string; query: string; limit?: number },
): Promise<string> {
  if (!db || !opts.companyId) return '';
  const limit = opts.limit ?? 5;
  const categories = categoriesForAgent(opts.agentSlug);
  try {
    const e = await embed(opts.query);
    if (e) {
      const { data, error } = await db.rpc('cactus_match_chunks', {
        p_company: opts.companyId, p_query: toVectorLiteral(e), p_categories: categories, p_limit: limit,
      });
      if (!error && data && data.length) {
        return (data as any[]).map((r) => r.content).join('\n---\n').slice(0, 3500);
      }
    }
    // Fallback sin embeddings/sin match: chunks recientes dentro del scope del agente
    const { data } = await db.from('knowledge_chunks')
      .select('content').eq('company_id', opts.companyId).in('category', categories)
      .order('created_at', { ascending: false }).limit(limit);
    return (data || []).map((r: any) => r.content).join('\n---\n').slice(0, 3500);
  } catch {
    return '';
  }
}
