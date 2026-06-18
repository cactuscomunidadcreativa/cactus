-- ============================================================================
-- 042 · Centro de Operaciones de agentes — nivel GLOBAL ("Cactus main").
-- agent_configs.company_id puede ser NULL = configuración global por defecto que
-- edita el super-admin; cada empresa la sobreescribe. Resolución: empresa → global → catálogo.
-- Idempotente. Espejo en src/lib/cactus/schema-sql.ts.
-- ============================================================================

-- Permitir filas globales (company_id NULL)
ALTER TABLE public.agent_configs ALTER COLUMN company_id DROP NOT NULL;
-- Unicidad para las filas globales (una por agente). Las de empresa siguen con UNIQUE(company_id, slug).
CREATE UNIQUE INDEX IF NOT EXISTS uq_agent_configs_global ON public.agent_configs(slug) WHERE company_id IS NULL;

-- RLS: TODOS leen las globales; ESCRIBE global solo super-admin; las de empresa, sus miembros.
DROP POLICY IF EXISTS agent_configs_tenant ON public.agent_configs;
DROP POLICY IF EXISTS agent_configs_read   ON public.agent_configs;
DROP POLICY IF EXISTS agent_configs_write  ON public.agent_configs;
CREATE POLICY agent_configs_read ON public.agent_configs FOR SELECT
  USING (company_id IS NULL OR company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin());
CREATE POLICY agent_configs_write ON public.agent_configs FOR ALL
  USING ((company_id IS NOT NULL AND company_id IN (SELECT public.cactus_company_ids())) OR public.is_super_admin())
  WITH CHECK ((company_id IS NOT NULL AND company_id IN (SELECT public.cactus_company_ids())) OR public.is_super_admin());
