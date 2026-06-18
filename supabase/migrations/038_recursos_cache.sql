-- ============================================================================
-- 038 · Fase D — Créditos vivos + motor de recursos. Idempotente, aditivo.
--   • companies.ai_mode (ahorro | equilibrio | calidad)
--   • response_cache: respuestas repetidas → costo 0 (porte de EGO RespuestaCache)
-- Espejo en src/lib/cactus/schema-sql.ts.
-- ============================================================================

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS ai_mode text NOT NULL DEFAULT 'equilibrio';

CREATE TABLE IF NOT EXISTS public.response_cache (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_slug  text,
  prompt_hash text NOT NULL,
  model       text,
  content     text NOT NULL,
  hits        integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (company_id, prompt_hash)
);
CREATE INDEX IF NOT EXISTS idx_response_cache_company ON public.response_cache(company_id);

ALTER TABLE public.response_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS response_cache_tenant ON public.response_cache;
CREATE POLICY response_cache_tenant ON public.response_cache FOR ALL
  USING (company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin())
  WITH CHECK (company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin());
