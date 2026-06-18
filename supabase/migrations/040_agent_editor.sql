-- ============================================================================
-- 040 · Editor de agentes — campos editables por empresa. Idempotente, aditivo.
-- agent_configs ya tiene provider/model/prompt/culture_prompt/company_values/
-- company_tone/industry_context/custom_instructions/is_active (Acción 3).
-- Sumamos nombre, descripción y foto para el front de edición.
-- Espejo en src/lib/cactus/schema-sql.ts.
-- ============================================================================

ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS description  text;
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS image_url    text;
