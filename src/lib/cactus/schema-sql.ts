// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA_SQL — esquema completo de Cactus Comunidad Creativa, idempotente.
// Lo corre el botón "Desplegar base de datos" del admin (sin psql, sin SQL a mano).
// Crea tablas, RLS, seeds, arregla la recursión de Agave y deja al fundador super-admin.
// ═══════════════════════════════════════════════════════════════════════════

export const SCHEMA_SQL = `
-- ── Super-admin del fundador ────────────────────────────────────────────────
UPDATE public.profiles p SET role = 'super_admin', updated_at = now()
FROM auth.users u
WHERE u.id = p.id AND lower(u.email) = 'eduardo@cactuscomunidadcreativa.com'
  AND COALESCE(p.role, 'user') <> 'super_admin';

-- ── Fix recursión RLS de Agave ──────────────────────────────────────────────
DROP POLICY IF EXISTS "User sees own client users" ON public.agave_client_users;
CREATE POLICY "User sees own client users" ON public.agave_client_users FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());

-- ── Brand Kit ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cactus_brand_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, industry text, offer text, audience text, tone text,
  values text[] DEFAULT '{}', colors jsonb DEFAULT '{}'::jsonb, voice jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.cactus_brand_kits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cactus_brand_kits_owner ON public.cactus_brand_kits;
CREATE POLICY cactus_brand_kits_owner ON public.cactus_brand_kits FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Knowledge Vault ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cactus_knowledge_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_kit_id uuid REFERENCES public.cactus_brand_kits(id) ON DELETE CASCADE,
  title text NOT NULL, kind text DEFAULT 'note', content text, source_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.cactus_knowledge_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cactus_knowledge_owner ON public.cactus_knowledge_items;
CREATE POLICY cactus_knowledge_owner ON public.cactus_knowledge_items FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Campañas + variantes emocionales ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cactus_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_kit_id uuid REFERENCES public.cactus_brand_kits(id) ON DELETE SET NULL,
  name text, brief jsonb NOT NULL DEFAULT '{}'::jsonb, objective text, channel text,
  credits_used integer DEFAULT 0, created_at timestamptz DEFAULT now()
);
ALTER TABLE public.cactus_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cactus_campaigns_owner ON public.cactus_campaigns;
CREATE POLICY cactus_campaigns_owner ON public.cactus_campaigns FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.cactus_message_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.cactus_campaigns(id) ON DELETE CASCADE,
  profile text NOT NULL, emotion text, headline text, body text, cta text, rationale text,
  axes jsonb DEFAULT '{}'::jsonb, performance jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now()
);
ALTER TABLE public.cactus_message_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cactus_variants_owner ON public.cactus_message_variants;
CREATE POLICY cactus_variants_owner ON public.cactus_message_variants FOR ALL
  USING (EXISTS (SELECT 1 FROM public.cactus_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cactus_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid()));

-- ── Config por agente (API key, modelo, prompt) — por usuario ───────────────
CREATE TABLE IF NOT EXISTS public.cactus_agent_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_slug text NOT NULL,
  model text, provider text, api_key_enc text, temperature numeric(3,2),
  system_prompt text, enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, agent_slug)
);
ALTER TABLE public.cactus_agent_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cactus_agent_configs_owner ON public.cactus_agent_configs;
CREATE POLICY cactus_agent_configs_owner ON public.cactus_agent_configs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Créditos: wallet + ledger (liquidación por tokens) ──────────────────────
CREATE TABLE IF NOT EXISTS public.cactus_credit_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text DEFAULT 'starter', balance integer DEFAULT 0, byok boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.cactus_credit_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cactus_wallets_owner ON public.cactus_credit_wallets;
CREATE POLICY cactus_wallets_owner ON public.cactus_credit_wallets FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.cactus_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta integer NOT NULL, reason text, agent_slug text, model text,
  cost_usd numeric(10,5), created_at timestamptz DEFAULT now()
);
ALTER TABLE public.cactus_credit_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cactus_ledger_owner ON public.cactus_credit_ledger;
CREATE POLICY cactus_ledger_owner ON public.cactus_credit_ledger FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Llaves API por workspace (BYOK) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cactus_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL, key_enc text NOT NULL, created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);
ALTER TABLE public.cactus_api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cactus_api_keys_owner ON public.cactus_api_keys;
CREATE POLICY cactus_api_keys_owner ON public.cactus_api_keys FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Activación de agentes por usuario ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cactus_agent_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_slug text NOT NULL, status text DEFAULT 'active', created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, agent_slug)
);
ALTER TABLE public.cactus_agent_activations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cactus_activations_owner ON public.cactus_agent_activations;
CREATE POLICY cactus_activations_owner ON public.cactus_agent_activations FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Costos de modelo (lectura pública autenticada) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.cactus_model_costs (
  model text PRIMARY KEY, input_per_m numeric(10,4), output_per_m numeric(10,4),
  per_image numeric(10,4), per_video_sec numeric(10,4)
);
ALTER TABLE public.cactus_model_costs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cactus_model_costs_read ON public.cactus_model_costs;
CREATE POLICY cactus_model_costs_read ON public.cactus_model_costs FOR SELECT USING (true);
INSERT INTO public.cactus_model_costs (model, input_per_m, output_per_m, per_image, per_video_sec) VALUES
  ('claude', 3, 15, NULL, NULL), ('claude-haiku', 0.8, 4, NULL, NULL),
  ('gpt', 2.5, 10, NULL, NULL), ('gpt-mini', 0.15, 0.6, NULL, NULL),
  ('gemini', 1.25, 5, NULL, NULL), ('gpt-image', NULL, NULL, 0.04, NULL),
  ('kling', NULL, NULL, NULL, 0.10), ('suno', NULL, NULL, 0.05, NULL)
ON CONFLICT (model) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- ORQUESTADOR (espejo de 033_ramona_orchestrator.sql) — base de Ramona.
-- Necesarias para 034 (company_id), 037 (versionado) y 039 (feedback). Idempotente.
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.cactus_set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN new.updated_at = now(); RETURN new; END $$;

CREATE TABLE IF NOT EXISTS public.cactus_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_kit_id uuid REFERENCES public.cactus_brand_kits(id) ON DELETE SET NULL,
  name text NOT NULL, objective text, summary text,
  status text NOT NULL DEFAULT 'active', is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cactus_projects_user ON public.cactus_projects(user_id);

CREATE TABLE IF NOT EXISTS public.cactus_project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.cactus_projects(id) ON DELETE CASCADE,
  agent_slug text NOT NULL, action text NOT NULL,
  status text NOT NULL DEFAULT 'pending', progress integer NOT NULL DEFAULT 0,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cactus_tasks_user ON public.cactus_project_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_cactus_tasks_project ON public.cactus_project_tasks(project_id);

CREATE TABLE IF NOT EXISTS public.cactus_project_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.cactus_projects(id) ON DELETE CASCADE,
  role text NOT NULL, content text NOT NULL, plan jsonb, credits integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cactus_messages_user ON public.cactus_project_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_cactus_messages_project ON public.cactus_project_messages(project_id);

CREATE TABLE IF NOT EXISTS public.cactus_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.cactus_projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.cactus_project_tasks(id) ON DELETE SET NULL,
  agent_slug text, title text NOT NULL, kind text NOT NULL DEFAULT 'doc',
  status text NOT NULL DEFAULT 'ready', content text, url text,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cactus_deliverables_user ON public.cactus_deliverables(user_id);
CREATE INDEX IF NOT EXISTS idx_cactus_deliverables_project ON public.cactus_deliverables(project_id);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cactus_projects','cactus_project_tasks','cactus_deliverables'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %1$s_updated_at ON public.%1$I;', t);
    EXECUTE format('CREATE TRIGGER %1$s_updated_at BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.cactus_set_updated_at();', t);
  END LOOP;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cactus_projects','cactus_project_tasks','cactus_project_messages','cactus_deliverables'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %1$s_owner ON public.%1$I;', t);
    EXECUTE format($f$
      CREATE POLICY %1$s_owner ON public.%1$I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    $f$, t);
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- MULTIEMPRESA (Fase A · Acción 1+2) — espejo de supabase/migrations/034_multitenant.sql
-- Org → Empresa(tenant) → Membership(RBAC). Aditivo, idempotente. Plano de control:
-- lectura por membresía, escritura solo del dueño de la organización (o super-admin).
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL, name text NOT NULL,
  tokens_monthly bigint NOT NULL DEFAULT 0, max_users integer NOT NULL DEFAULT 0,
  included_agents text[] NOT NULL DEFAULT '{}', features jsonb NOT NULL DEFAULT '{}'::jsonb,
  price_monthly_usd numeric(10,2) NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
INSERT INTO public.plans (slug, name, tokens_monthly, max_users, included_agents, price_monthly_usd, sort_order) VALUES
  ('free','Free',50000,1,ARRAY['ramona','cactus-ia'],0,0),
  ('starter','Starter',500000,3,ARRAY['ramona','cactus-ia'],29,1),
  ('business','Business',2000000,10,ARRAY['ramona','cactus-ia'],99,2),
  ('agency','Agency',0,0,ARRAY['*'],299,3)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, slug text UNIQUE,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations(owner_id);

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL, slug text, industry text,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  license_count integer NOT NULL DEFAULT 0, branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  stripe_customer_id text, stripe_subscription_id text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE (org_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_companies_org ON public.companies(org_id);
CREATE INDEX IF NOT EXISTS idx_companies_plan ON public.companies(plan_id);

CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner'
    CHECK (role IN ('owner','admin','marketing','ventas','legal','ops','invitado','cliente')),
  tokens_quota bigint NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, company_id)
);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_company ON public.memberships(company_id);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS primary_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.cactus_set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN new.updated_at = now(); RETURN new; END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['organizations','companies','memberships','plans'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %1$s_updated_at ON public.%1$I;', t);
    EXECUTE format('CREATE TRIGGER %1$s_updated_at BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.cactus_set_updated_at();', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.cactus_company_ids() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.memberships WHERE user_id = auth.uid();
$$;
CREATE OR REPLACE FUNCTION public.cactus_org_ids() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id FROM public.organizations o WHERE o.owner_id = auth.uid()
  UNION
  SELECT c.org_id FROM public.companies c WHERE c.id IN (SELECT m.company_id FROM public.memberships m WHERE m.user_id = auth.uid());
$$;
CREATE OR REPLACE FUNCTION public.cactus_owned_org_ids() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.organizations WHERE owner_id = auth.uid();
$$;
CREATE OR REPLACE FUNCTION public.cactus_owned_company_ids() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id FROM public.companies c JOIN public.organizations o ON o.id = c.org_id WHERE o.owner_id = auth.uid();
$$;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS plans_read ON public.plans;
DROP POLICY IF EXISTS plans_admin ON public.plans;
CREATE POLICY plans_read ON public.plans FOR SELECT USING (true);
CREATE POLICY plans_admin ON public.plans FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS organizations_access ON public.organizations;
DROP POLICY IF EXISTS organizations_select ON public.organizations;
DROP POLICY IF EXISTS organizations_manage ON public.organizations;
CREATE POLICY organizations_select ON public.organizations FOR SELECT
  USING (owner_id = auth.uid() OR id IN (SELECT public.cactus_org_ids()) OR public.is_super_admin());
CREATE POLICY organizations_manage ON public.organizations FOR ALL
  USING (owner_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_super_admin());

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS companies_access ON public.companies;
DROP POLICY IF EXISTS companies_select ON public.companies;
DROP POLICY IF EXISTS companies_manage ON public.companies;
CREATE POLICY companies_select ON public.companies FOR SELECT
  USING (id IN (SELECT public.cactus_company_ids()) OR org_id IN (SELECT public.cactus_org_ids()) OR public.is_super_admin());
CREATE POLICY companies_manage ON public.companies FOR ALL
  USING (org_id IN (SELECT public.cactus_owned_org_ids()) OR public.is_super_admin())
  WITH CHECK (org_id IN (SELECT public.cactus_owned_org_ids()) OR public.is_super_admin());

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS memberships_select ON public.memberships;
DROP POLICY IF EXISTS memberships_write ON public.memberships;
DROP POLICY IF EXISTS memberships_manage ON public.memberships;
CREATE POLICY memberships_select ON public.memberships FOR SELECT
  USING (user_id = auth.uid() OR company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin());
CREATE POLICY memberships_manage ON public.memberships FOR ALL
  USING (company_id IN (SELECT public.cactus_owned_company_ids()) OR public.is_super_admin())
  WITH CHECK (company_id IN (SELECT public.cactus_owned_company_ids()) OR public.is_super_admin());

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'cactus_projects','cactus_project_tasks','cactus_project_messages',
    'cactus_deliverables','cactus_brand_kits','cactus_knowledge_items','cactus_credit_ledger'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;', t);
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%1$s_company ON public.%1$I(company_id);', t);
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
      EXECUTE format('DROP POLICY IF EXISTS %1$s_access ON public.%1$I;', t);
      EXECUTE format($f$
        CREATE POLICY %1$s_access ON public.%1$I FOR ALL USING (
          user_id = auth.uid()
          OR (company_id IS NOT NULL AND company_id IN (SELECT public.cactus_company_ids()))
          OR public.is_super_admin()
        ) WITH CHECK (
          user_id = auth.uid()
          OR (company_id IS NOT NULL AND company_id IN (SELECT public.cactus_company_ids()))
          OR public.is_super_admin()
        );
      $f$, t);
    END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.cactus_ensure_default_company(p_user uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company uuid; v_org uuid; v_label text; v_plan uuid;
BEGIN
  IF p_user IS NULL THEN RETURN NULL; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('cactus_default_company'), hashtext(p_user::text));
  SELECT company_id INTO v_company FROM public.memberships WHERE user_id = p_user ORDER BY created_at ASC, company_id ASC LIMIT 1;
  IF v_company IS NOT NULL THEN RETURN v_company; END IF;
  SELECT COALESCE(NULLIF(p.full_name, ''), NULLIF(split_part(u.email, '@', 1), ''), 'Mi empresa')
    INTO v_label FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id WHERE u.id = p_user;
  v_label := COALESCE(v_label, 'Mi empresa');
  SELECT id INTO v_plan FROM public.plans WHERE slug = 'free' LIMIT 1;
  INSERT INTO public.organizations (owner_id, name) VALUES (p_user, v_label) RETURNING id INTO v_org;
  INSERT INTO public.companies (org_id, name, plan_id) VALUES (v_org, v_label, v_plan) RETURNING id INTO v_company;
  INSERT INTO public.memberships (user_id, company_id, role) VALUES (p_user, v_company, 'owner') ON CONFLICT (user_id, company_id) DO NOTHING;
  UPDATE public.profiles SET primary_company_id = v_company, updated_at = now() WHERE id = p_user AND primary_company_id IS NULL;
  RETURN v_company;
END $$;

CREATE OR REPLACE FUNCTION public.cactus_provision_new_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  BEGIN PERFORM public.cactus_ensure_default_company(new.id);
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'cactus_provision_new_profile: omitido para % (%).', new.id, SQLERRM; END;
  RETURN new;
END $$;
DROP TRIGGER IF EXISTS cactus_provision_on_profile ON public.profiles;
CREATE TRIGGER cactus_provision_on_profile AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.cactus_provision_new_profile();

DO $$
DECLARE r record; v_company uuid;
BEGIN
  IF to_regclass('public.cactus_projects') IS NULL OR to_regclass('public.cactus_project_tasks') IS NULL
     OR to_regclass('public.cactus_project_messages') IS NULL OR to_regclass('public.cactus_deliverables') IS NULL
     OR to_regclass('public.cactus_brand_kits') IS NULL OR to_regclass('public.cactus_knowledge_items') IS NULL
     OR to_regclass('public.cactus_credit_ledger') IS NULL THEN
    RAISE NOTICE 'multiempresa: backfill omitido (faltan tablas cactus_*).';
    RETURN;
  END IF;
  FOR r IN
    SELECT DISTINCT user_id FROM (
      SELECT user_id FROM public.cactus_projects
      UNION SELECT user_id FROM public.cactus_project_tasks
      UNION SELECT user_id FROM public.cactus_project_messages
      UNION SELECT user_id FROM public.cactus_deliverables
      UNION SELECT user_id FROM public.cactus_brand_kits
      UNION SELECT user_id FROM public.cactus_knowledge_items
      UNION SELECT user_id FROM public.cactus_credit_ledger
    ) s WHERE user_id IS NOT NULL
  LOOP
    v_company := public.cactus_ensure_default_company(r.user_id);
    IF v_company IS NOT NULL THEN
      UPDATE public.cactus_projects SET company_id = v_company WHERE user_id = r.user_id AND company_id IS NULL;
      UPDATE public.cactus_project_tasks SET company_id = v_company WHERE user_id = r.user_id AND company_id IS NULL;
      UPDATE public.cactus_project_messages SET company_id = v_company WHERE user_id = r.user_id AND company_id IS NULL;
      UPDATE public.cactus_deliverables SET company_id = v_company WHERE user_id = r.user_id AND company_id IS NULL;
      UPDATE public.cactus_brand_kits SET company_id = v_company WHERE user_id = r.user_id AND company_id IS NULL;
      UPDATE public.cactus_knowledge_items SET company_id = v_company WHERE user_id = r.user_id AND company_id IS NULL;
      UPDATE public.cactus_credit_ledger SET company_id = v_company WHERE user_id = r.user_id AND company_id IS NULL;
    END IF;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- FASE A · ACCIONES 3–8 (espejo de supabase/migrations/035_phase_a_3to8.sql)
-- on/off de agentes · consumo/cuotas · alertas · dominios/canales. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.agent_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  slug text NOT NULL, is_active boolean NOT NULL DEFAULT true,
  provider text, model text, prompt text, culture_prompt text,
  company_values text, company_tone text, industry_context text, custom_instructions text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE (company_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_agent_configs_company ON public.agent_configs(company_id);

CREATE TABLE IF NOT EXISTS public.user_ai_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL, enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, feature)
);
CREATE INDEX IF NOT EXISTS idx_user_ai_controls_user ON public.user_ai_controls(user_id);

CREATE TABLE IF NOT EXISTS public.agent_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_slug text NOT NULL, mode text NOT NULL DEFAULT 'permanent',
  status text NOT NULL DEFAULT 'active', task_id uuid, credits integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_activations_company ON public.agent_activations(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_agent_activations_perm ON public.agent_activations(company_id, agent_slug) WHERE mode = 'permanent';

CREATE TABLE IF NOT EXISTS public.usage_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT current_date, agent_slug text NOT NULL DEFAULT 'unknown',
  model text NOT NULL DEFAULT 'unknown', tokens_in bigint NOT NULL DEFAULT 0,
  tokens_out bigint NOT NULL DEFAULT 0, calls integer NOT NULL DEFAULT 0,
  cost_usd numeric(12,5) NOT NULL DEFAULT 0, credits integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (company_id, day, agent_slug, model)
);
CREATE INDEX IF NOT EXISTS idx_usage_daily_company_day ON public.usage_daily(company_id, day);

CREATE TABLE IF NOT EXISTS public.user_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT current_date, tokens_in bigint NOT NULL DEFAULT 0,
  tokens_out bigint NOT NULL DEFAULT 0, calls integer NOT NULL DEFAULT 0,
  cost_usd numeric(12,5) NOT NULL DEFAULT 0, credits integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, company_id, day)
);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_day ON public.user_usage(user_id, day);

CREATE TABLE IF NOT EXISTS public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  origin text NOT NULL, type text NOT NULL, severity text NOT NULL DEFAULT 'info',
  title text NOT NULL, body text, status text NOT NULL DEFAULT 'open',
  dedup_key text, payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alerts_company ON public.alerts(company_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_alerts_dedup ON public.alerts(company_id, dedup_key) WHERE dedup_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  domain text NOT NULL, status text NOT NULL DEFAULT 'pending', is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE (company_id, domain)
);
CREATE INDEX IF NOT EXISTS idx_domains_company ON public.domains(company_id);

CREATE TABLE IF NOT EXISTS public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kind text NOT NULL, label text, status text NOT NULL DEFAULT 'disconnected',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_channels_company ON public.channels(company_id);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['agent_configs','user_ai_controls','usage_daily','user_usage','alerts','domains','channels'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %1$s_updated_at ON public.%1$I;', t);
    EXECUTE format('CREATE TRIGGER %1$s_updated_at BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.cactus_set_updated_at();', t);
  END LOOP;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['agent_configs','agent_activations','usage_daily','user_usage','alerts','domains','channels'] LOOP
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

ALTER TABLE public.user_ai_controls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_ai_controls_owner ON public.user_ai_controls;
CREATE POLICY user_ai_controls_owner ON public.user_ai_controls FOR ALL
  USING (user_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS user_usage_self ON public.user_usage;
CREATE POLICY user_usage_self ON public.user_usage FOR ALL
  USING (user_id = auth.uid() OR company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() OR company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin());

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

-- ════════════════════════════════════════════════════════════════════════════
-- FASE B · CEREBRO RAG (espejo de supabase/migrations/036_cerebro_rag.sql)
-- pgvector + knowledge_chunks + match RPC. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

ALTER TABLE public.cactus_knowledge_items ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'brand';

CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  knowledge_item_id uuid REFERENCES public.cactus_knowledge_items(id) ON DELETE CASCADE,
  brand_kit_id uuid REFERENCES public.cactus_brand_kits(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'note', category text NOT NULL DEFAULT 'brand',
  content text NOT NULL, embedding extensions.vector(1536), tokens integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_company ON public.knowledge_chunks(company_id, category);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_vec ON public.knowledge_chunks USING hnsw (embedding extensions.vector_cosine_ops);

ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS knowledge_chunks_tenant ON public.knowledge_chunks;
CREATE POLICY knowledge_chunks_tenant ON public.knowledge_chunks FOR ALL
  USING (company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin())
  WITH CHECK (company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin());

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

-- ════════════════════════════════════════════════════════════════════════════
-- FASE C · EJECUCIÓN v2 (espejo de supabase/migrations/037_ejecucion_v2.sql)
-- Versionado de entregables + auditoría model_usage. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.cactus_deliverables ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE public.cactus_deliverables ADD COLUMN IF NOT EXISTS version_of uuid REFERENCES public.cactus_deliverables(id) ON DELETE SET NULL;
ALTER TABLE public.cactus_deliverables ADD COLUMN IF NOT EXISTS is_latest boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_cactus_deliverables_versionof ON public.cactus_deliverables(version_of);

CREATE TABLE IF NOT EXISTS public.model_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_slug text, provider text, model text, kind text NOT NULL DEFAULT 'agent_run',
  tokens_in bigint NOT NULL DEFAULT 0, tokens_out bigint NOT NULL DEFAULT 0,
  cost_usd numeric(12,5) NOT NULL DEFAULT 0, credits integer NOT NULL DEFAULT 0,
  project_id uuid, task_id uuid, deliverable_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_model_usage_company ON public.model_usage(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_model_usage_user ON public.model_usage(user_id, created_at);

ALTER TABLE public.model_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS model_usage_tenant ON public.model_usage;
CREATE POLICY model_usage_tenant ON public.model_usage FOR ALL
  USING (user_id = auth.uid() OR company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() OR company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- FASE D · RECURSOS + CACHÉ (espejo de supabase/migrations/038_recursos_cache.sql)
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS ai_mode text NOT NULL DEFAULT 'equilibrio';

CREATE TABLE IF NOT EXISTS public.response_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_slug text, prompt_hash text NOT NULL, model text, content text NOT NULL,
  hits integer NOT NULL DEFAULT 0, created_at timestamptz DEFAULT now(),
  UNIQUE (company_id, prompt_hash)
);
CREATE INDEX IF NOT EXISTS idx_response_cache_company ON public.response_cache(company_id);
ALTER TABLE public.response_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS response_cache_tenant ON public.response_cache;
CREATE POLICY response_cache_tenant ON public.response_cache FOR ALL
  USING (company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin())
  WITH CHECK (company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- FASE E · APRENDIZAJE (espejo de supabase/migrations/039_aprendizaje.sql)
-- feedback → preferencias (empresa/agente/usuario) → skills. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.agent_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deliverable_id uuid REFERENCES public.cactus_deliverables(id) ON DELETE SET NULL,
  agent_slug text, rating integer NOT NULL DEFAULT 0, comment text, created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_feedback_company ON public.agent_feedback(company_id, created_at);

CREATE TABLE IF NOT EXISTS public.business_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'company', agent_slug text, content text NOT NULL,
  source text NOT NULL DEFAULT 'manual', weight integer NOT NULL DEFAULT 1, created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_business_prefs_company ON public.business_preferences(company_id, scope);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_slug text, content text NOT NULL, created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON public.user_preferences(user_id);

CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_slug text, name text NOT NULL, instructions text NOT NULL,
  source text NOT NULL DEFAULT 'manual', created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_skills_company ON public.skills(company_id);

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

-- ════════════════════════════════════════════════════════════════════════════
-- EDITOR DE AGENTES (espejo de 040_agent_editor.sql) — campos editables por empresa
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS image_url text;

-- ════════════════════════════════════════════════════════════════════════════
-- SECRETOS DE AGENTE (espejo de 041_agent_secrets.sql) — cifrados AES-256-GCM
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.agent_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_slug text NOT NULL, name text NOT NULL, kind text NOT NULL DEFAULT 'token',
  secret_enc text NOT NULL, last4 text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE (company_id, agent_slug, name)
);
CREATE INDEX IF NOT EXISTS idx_agent_secrets_company ON public.agent_secrets(company_id, agent_slug);
ALTER TABLE public.agent_secrets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agent_secrets_tenant ON public.agent_secrets;
CREATE POLICY agent_secrets_tenant ON public.agent_secrets FOR ALL
  USING (company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin())
  WITH CHECK (company_id IN (SELECT public.cactus_company_ids()) OR public.is_super_admin());
`;
