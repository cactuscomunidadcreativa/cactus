-- ============================================================================
-- 043 · Video de animación por agente. Idempotente, aditivo.
-- agent_configs += video_url (mismo modelo global/empresa que la foto).
-- Espejo en src/lib/cactus/schema-sql.ts.
-- ============================================================================
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS video_url text;
