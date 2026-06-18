-- ============================================================================
-- 037 · Fase C — Ejecución v2. Idempotente, aditivo.
--   • Versionado de entregables (version / version_of / is_latest) + estados
--   • model_usage: auditoría granular por llamada (quién/agente/modelo/contexto)
-- Espejo en src/lib/cactus/schema-sql.ts.
-- ============================================================================

-- Versionado de entregables (estados: draft|review|ready|approved|published|archived)
ALTER TABLE public.cactus_deliverables ADD COLUMN IF NOT EXISTS version    integer NOT NULL DEFAULT 1;
ALTER TABLE public.cactus_deliverables ADD COLUMN IF NOT EXISTS version_of uuid REFERENCES public.cactus_deliverables(id) ON DELETE SET NULL;
ALTER TABLE public.cactus_deliverables ADD COLUMN IF NOT EXISTS is_latest  boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_cactus_deliverables_versionof ON public.cactus_deliverables(version_of);

-- Auditoría granular de uso de modelos (trazabilidad por acción)
CREATE TABLE IF NOT EXISTS public.model_usage (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_slug    text,
  provider      text,
  model         text,
  kind          text NOT NULL DEFAULT 'agent_run',  -- agent_run | subagent | chat | observer
  tokens_in     bigint NOT NULL DEFAULT 0,
  tokens_out    bigint NOT NULL DEFAULT 0,
  cost_usd      numeric(12,5) NOT NULL DEFAULT 0,
  credits       integer NOT NULL DEFAULT 0,
  project_id    uuid,
  task_id       uuid,
  deliverable_id uuid,
  meta          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_model_usage_company ON public.model_usage(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_model_usage_user ON public.model_usage(user_id, created_at);

ALTER TABLE public.model_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS model_usage_tenant ON public.model_usage;
CREATE POLICY model_usage_tenant ON public.model_usage FOR ALL
  USING (user_id = auth.uid() OR company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() OR company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin());
