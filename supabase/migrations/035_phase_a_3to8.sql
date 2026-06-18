-- ============================================================================
-- 035 · Fase A · Acciones 3–8 — capa de datos (idempotente, aditivo)
--   3. agent_configs (on/off por empresa) + user_ai_controls + agent_activations (one-shot)
--   4. usage_daily + user_usage (consumo/cuotas)
--   5. alerts (bus de escalación a Ramona)
--   6. observadores → escriben en alerts (sin tablas nuevas)
--   7. domains + channels (por empresa)
--   8. RBAC → se aplica en código (usa memberships.role)
-- RLS: tenant por cactus_company_ids() (helper SECURITY DEFINER de la 034) + super-admin.
-- Espejo en src/lib/cactus/schema-sql.ts (botón "Desplegar base de datos").
-- ============================================================================

-- ── 3 · Configuración de agentes por empresa (on/off + persona) ─────────────
CREATE TABLE IF NOT EXISTS public.agent_configs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  slug               text NOT NULL,
  is_active          boolean NOT NULL DEFAULT true,
  provider           text,
  model              text,
  prompt             text,
  culture_prompt     text,
  company_values     text,
  company_tone       text,
  industry_context   text,
  custom_instructions text,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),
  UNIQUE (company_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_agent_configs_company ON public.agent_configs(company_id);

-- Apagado puntual por usuario (override personal)
CREATE TABLE IF NOT EXISTS public.user_ai_controls (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature     text NOT NULL,                 -- slug de agente o feature
  enabled     boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, feature)
);
CREATE INDEX IF NOT EXISTS idx_user_ai_controls_user ON public.user_ai_controls(user_id);

-- Activaciones de agente (permanente o one-shot por tarea, cobradas en créditos)
CREATE TABLE IF NOT EXISTS public.agent_activations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_slug  text NOT NULL,
  mode        text NOT NULL DEFAULT 'permanent',  -- permanent | one_shot
  status      text NOT NULL DEFAULT 'active',      -- active | consumed | revoked
  task_id     uuid,                                -- one-shot: tarea que lo gatilló
  credits     integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_activations_company ON public.agent_activations(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_agent_activations_perm
  ON public.agent_activations(company_id, agent_slug) WHERE mode = 'permanent';

-- ── 4 · Consumo (cuotas por plan) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usage_daily (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  day         date NOT NULL DEFAULT current_date,
  agent_slug  text NOT NULL DEFAULT 'unknown',
  model       text NOT NULL DEFAULT 'unknown',
  tokens_in   bigint NOT NULL DEFAULT 0,
  tokens_out  bigint NOT NULL DEFAULT 0,
  calls       integer NOT NULL DEFAULT 0,
  cost_usd    numeric(12,5) NOT NULL DEFAULT 0,
  credits     integer NOT NULL DEFAULT 0,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (company_id, day, agent_slug, model)
);
CREATE INDEX IF NOT EXISTS idx_usage_daily_company_day ON public.usage_daily(company_id, day);

CREATE TABLE IF NOT EXISTS public.user_usage (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  day         date NOT NULL DEFAULT current_date,
  tokens_in   bigint NOT NULL DEFAULT 0,
  tokens_out  bigint NOT NULL DEFAULT 0,
  calls       integer NOT NULL DEFAULT 0,
  cost_usd    numeric(12,5) NOT NULL DEFAULT 0,
  credits     integer NOT NULL DEFAULT 0,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, company_id, day)
);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_day ON public.user_usage(user_id, day);

-- ── 5 · Alertas (bus de escalación a Ramona) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alerts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  origin      text NOT NULL,                 -- agente/observador que la levanta
  type        text NOT NULL,                 -- market | reputation | opportunity | quota | care | news ...
  severity    text NOT NULL DEFAULT 'info',  -- info | warning | critical
  title       text NOT NULL,
  body        text,
  status      text NOT NULL DEFAULT 'open',  -- open | ack | resolved | dismissed
  dedup_key   text,                          -- evita duplicados del mismo hallazgo
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alerts_company ON public.alerts(company_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_alerts_dedup
  ON public.alerts(company_id, dedup_key) WHERE dedup_key IS NOT NULL;

-- ── 7 · Dominios + canales (por empresa) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.domains (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  domain      text NOT NULL,
  status      text NOT NULL DEFAULT 'pending', -- pending | verified | error
  is_primary  boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (company_id, domain)
);
CREATE INDEX IF NOT EXISTS idx_domains_company ON public.domains(company_id);

CREATE TABLE IF NOT EXISTS public.channels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kind        text NOT NULL,                 -- whatsapp | email | slack | telegram | instagram ...
  label       text,
  status      text NOT NULL DEFAULT 'disconnected', -- disconnected | partial | connected
  config      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_channels_company ON public.channels(company_id);

-- ── updated_at (función ya existe; OR REPLACE = self-contained) ──────────────
CREATE OR REPLACE FUNCTION public.cactus_set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN new.updated_at = now(); RETURN new; END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'agent_configs','user_ai_controls','usage_daily','user_usage','alerts','domains','channels'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %1$s_updated_at ON public.%1$I;', t);
    EXECUTE format('CREATE TRIGGER %1$s_updated_at BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.cactus_set_updated_at();', t);
  END LOOP;
END $$;

-- ── RLS: tablas con company_id → miembros de la empresa (lectura/escritura) + super-admin
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'agent_configs','agent_activations','usage_daily','user_usage','alerts','domains','channels'
  ] LOOP
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

-- user_ai_controls: dueño por user_id
ALTER TABLE public.user_ai_controls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_ai_controls_owner ON public.user_ai_controls;
CREATE POLICY user_ai_controls_owner ON public.user_ai_controls FOR ALL
  USING (user_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

-- user_usage: además del scope por empresa, el propio usuario ve lo suyo
DROP POLICY IF EXISTS user_usage_self ON public.user_usage;
CREATE POLICY user_usage_self ON public.user_usage FOR ALL
  USING (user_id = auth.uid() OR company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() OR company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin());

-- ── Registro de consumo atómico e idempotente-por-acumulación (RPC) ──────────
CREATE OR REPLACE FUNCTION public.cactus_register_usage(
  p_company uuid, p_user uuid, p_agent text, p_model text,
  p_tokens_in bigint, p_tokens_out bigint, p_cost numeric, p_credits integer
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_company IS NOT NULL THEN
    INSERT INTO public.usage_daily (company_id, day, agent_slug, model, tokens_in, tokens_out, calls, cost_usd, credits)
    VALUES (p_company, current_date, COALESCE(NULLIF(p_agent,''),'unknown'), COALESCE(NULLIF(p_model,''),'unknown'),
            COALESCE(p_tokens_in,0), COALESCE(p_tokens_out,0), 1, COALESCE(p_cost,0), COALESCE(p_credits,0))
    ON CONFLICT (company_id, day, agent_slug, model) DO UPDATE SET
      tokens_in = usage_daily.tokens_in + EXCLUDED.tokens_in,
      tokens_out = usage_daily.tokens_out + EXCLUDED.tokens_out,
      calls = usage_daily.calls + 1,
      cost_usd = usage_daily.cost_usd + EXCLUDED.cost_usd,
      credits = usage_daily.credits + EXCLUDED.credits,
      updated_at = now();
  END IF;
  IF p_user IS NOT NULL THEN
    INSERT INTO public.user_usage (user_id, company_id, day, tokens_in, tokens_out, calls, cost_usd, credits)
    VALUES (p_user, p_company, current_date, COALESCE(p_tokens_in,0), COALESCE(p_tokens_out,0), 1, COALESCE(p_cost,0), COALESCE(p_credits,0))
    ON CONFLICT (user_id, company_id, day) DO UPDATE SET
      tokens_in = user_usage.tokens_in + EXCLUDED.tokens_in,
      tokens_out = user_usage.tokens_out + EXCLUDED.tokens_out,
      calls = user_usage.calls + 1,
      cost_usd = user_usage.cost_usd + EXCLUDED.cost_usd,
      credits = user_usage.credits + EXCLUDED.credits,
      updated_at = now();
  END IF;
END $$;
