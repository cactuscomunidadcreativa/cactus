-- ============================================================================
-- 036 · Fase B — Cerebro RAG (pgvector). Idempotente, aditivo.
--   • extension vector (en schema extensions) + knowledge_chunks (embeddings 1536)
--   • category en cactus_knowledge_items (scoping de tokens por agente)
--   • RPC cactus_match_chunks (búsqueda por similitud coseno, scopeada por empresa+categorías)
-- Embeddings: OpenAI text-embedding-3-small (1536). Tipo y opclass cualificados con
-- extensions.* para que el deploy por el botón funcione sin depender del search_path.
-- Espejo en src/lib/cactus/schema-sql.ts.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Categoría del Cerebro por item (brand|product|audience|market|content|ops|sales|finance|legal|people|support)
ALTER TABLE public.cactus_knowledge_items ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'brand';

CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  knowledge_item_id uuid REFERENCES public.cactus_knowledge_items(id) ON DELETE CASCADE,
  brand_kit_id      uuid REFERENCES public.cactus_brand_kits(id) ON DELETE CASCADE,
  source            text NOT NULL DEFAULT 'note',   -- brand | note | url | doc | faq
  category          text NOT NULL DEFAULT 'brand',
  content           text NOT NULL,
  embedding         extensions.vector(1536),
  tokens            integer NOT NULL DEFAULT 0,
  created_at        timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_company ON public.knowledge_chunks(company_id, category);
-- Índice ANN (si la versión de pgvector soporta hnsw). Si falla, la búsqueda sigue
-- funcionando por seq-scan; el deploy registra el fallo pero no se detiene.
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_vec
  ON public.knowledge_chunks USING hnsw (embedding extensions.vector_cosine_ops);

ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS knowledge_chunks_tenant ON public.knowledge_chunks;
CREATE POLICY knowledge_chunks_tenant ON public.knowledge_chunks FOR ALL
  USING (company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin())
  WITH CHECK (company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin());

-- Inserta un chunk (cast text→vector interno). SECURITY INVOKER → RLS aplica
-- (solo puedes escribir en empresas de las que eres miembro).
CREATE OR REPLACE FUNCTION public.cactus_insert_chunk(
  p_company uuid, p_item uuid, p_brand uuid, p_source text, p_category text,
  p_content text, p_tokens integer, p_embedding text
) RETURNS void
LANGUAGE plpgsql SET search_path = public, extensions AS $$
BEGIN
  INSERT INTO public.knowledge_chunks (company_id, knowledge_item_id, brand_kit_id, source, category, content, tokens, embedding)
  VALUES (p_company, p_item, p_brand, COALESCE(NULLIF(p_source,''),'note'), COALESCE(NULLIF(p_category,''),'brand'),
          p_content, COALESCE(p_tokens, 0),
          CASE WHEN p_embedding IS NULL OR p_embedding = '' THEN NULL ELSE p_embedding::extensions.vector END);
END $$;

-- Búsqueda por similitud (coseno). p_query = literal de vector '[...]' (cast interno).
-- p_categories NULL/vacío = todas. SECURITY INVOKER → RLS evita fugas entre empresas.
CREATE OR REPLACE FUNCTION public.cactus_match_chunks(
  p_company uuid, p_query text, p_categories text[], p_limit integer
) RETURNS TABLE (id uuid, content text, category text, similarity double precision)
LANGUAGE sql STABLE SET search_path = public, extensions AS $$
  SELECT kc.id, kc.content, kc.category,
         1 - (kc.embedding <=> p_query::extensions.vector) AS similarity
  FROM public.knowledge_chunks kc
  WHERE kc.company_id = p_company
    AND kc.embedding IS NOT NULL
    AND (p_categories IS NULL OR array_length(p_categories, 1) IS NULL OR kc.category = ANY(p_categories))
  ORDER BY kc.embedding <=> p_query::extensions.vector
  LIMIT GREATEST(COALESCE(p_limit, 5), 1);
$$;
