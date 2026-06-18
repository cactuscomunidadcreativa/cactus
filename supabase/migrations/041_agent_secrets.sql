-- ============================================================================
-- 041 · Secretos de agente — contraseñas / tokens / API keys por agente y empresa.
-- secret_enc SIEMPRE cifrado (AES-256-GCM, llave solo en el servidor). Idempotente.
-- RLS por empresa; el valor cifrado es inútil sin la llave del servidor.
-- Espejo en src/lib/cactus/schema-sql.ts.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_secrets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_slug  text NOT NULL,
  name        text NOT NULL,                 -- etiqueta: "OpenAI key", "WhatsApp token", "Password CRM"
  kind        text NOT NULL DEFAULT 'token', -- token | api_key | password
  secret_enc  text NOT NULL,                 -- cifrado AES-256-GCM (nunca texto plano)
  last4       text,                          -- pista no sensible para la UI
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (company_id, agent_slug, name)
);
CREATE INDEX IF NOT EXISTS idx_agent_secrets_company ON public.agent_secrets(company_id, agent_slug);

ALTER TABLE public.agent_secrets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agent_secrets_tenant ON public.agent_secrets;
CREATE POLICY agent_secrets_tenant ON public.agent_secrets FOR ALL
  USING (company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin())
  WITH CHECK (company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin());
