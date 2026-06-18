-- ============================================================================
-- 039 · Fase E — Aprendizaje. Idempotente, aditivo.
--   feedback → preferencias (empresa / agente / usuario) → skills
-- El contextualizador inyecta las preferencias aprendidas en cada ejecución.
-- Espejo en src/lib/cactus/schema-sql.ts.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_feedback (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deliverable_id uuid REFERENCES public.cactus_deliverables(id) ON DELETE SET NULL,
  agent_slug     text,
  rating         integer NOT NULL DEFAULT 0,   -- 1 = 👍 · -1 = 👎 · 0 = comentario
  comment        text,
  created_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_feedback_company ON public.agent_feedback(company_id, created_at);

-- Preferencias aprendidas a nivel empresa / agente (lenguaje natural)
CREATE TABLE IF NOT EXISTS public.business_preferences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scope       text NOT NULL DEFAULT 'company',  -- company | agent
  agent_slug  text,
  content     text NOT NULL,
  source      text NOT NULL DEFAULT 'manual',   -- manual | feedback
  weight      integer NOT NULL DEFAULT 1,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_business_prefs_company ON public.business_preferences(company_id, scope);

-- Preferencias a nivel usuario (4º nivel)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_slug  text,
  content     text NOT NULL,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON public.user_preferences(user_id);

-- Skills aprendidas/reutilizables por agente
CREATE TABLE IF NOT EXISTS public.skills (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_slug   text,
  name         text NOT NULL,
  instructions text NOT NULL,
  source       text NOT NULL DEFAULT 'manual',
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_skills_company ON public.skills(company_id);

-- RLS: tenant por empresa (+ usuario para user_preferences)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['agent_feedback','business_preferences','skills'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %1$s_tenant ON public.%1$I;', t);
    EXECUTE format($f$
      CREATE POLICY %1$s_tenant ON public.%1$I FOR ALL USING (
        company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin()
      ) WITH CHECK (
        company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin()
      );
    $f$, t);
  END LOOP;
END $$;

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_preferences_owner ON public.user_preferences;
CREATE POLICY user_preferences_owner ON public.user_preferences FOR ALL
  USING (user_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin());
