-- ============================================================================
-- 034 · Multiempresa (cimiento) — Organización → Empresa(Tenant) → Membership
-- Fase A · Acción 1. Aditivo y SIN romper lo existente (todo cuelga hoy de user_id).
--
--   • plans          — catálogo de planes (tokens_monthly, max_users, agentes incl.)
--   • organizations  — cuenta raíz (agrupa empresas), dueño = usuario
--   • companies      — el "tenant": SafePack, Teleperformance, CAARD… (branding, plan)
--   • memberships    — puente usuario↔empresa con rol (RBAC) y cuota de tokens
--   • profiles.primary_company_id — la empresa "activa" del usuario (selector futuro)
--   • company_id (NULLABLE) en cactus_projects / project_tasks / project_messages /
--     deliverables / brand_kits / knowledge_items / credit_ledger
--   • RLS aditiva: además del dueño (user_id), acceden los miembros de la empresa
--     (helpers SECURITY DEFINER, sin recursión) y el super-admin.
--   • Plano de control (organizations/companies/memberships): LECTURA por membresía,
--     ESCRITURA solo del dueño de la organización (o super-admin). Evita que un
--     miembro cualquiera se auto-inserte en otra empresa o borre facturación.
--   • Re-parenteo: crea org+empresa default por usuario (existentes vía backfill y
--     nuevos vía trigger en profiles) y migra los datos previos.
--
-- Idempotente (IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS / ON CONFLICT).
-- Las migraciones NO las aplica el asistente: Eduardo corre `npm run db:push`.
-- ============================================================================

-- ── Planes (catálogo global) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plans (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               text UNIQUE NOT NULL,
  name               text NOT NULL,
  tokens_monthly     bigint  NOT NULL DEFAULT 0,        -- 0 = ilimitado
  max_users          integer NOT NULL DEFAULT 0,        -- 0 = ilimitado (B2C)
  included_agents    text[]  NOT NULL DEFAULT '{}',     -- slugs incluidos; '*' = todos
  features           jsonb   NOT NULL DEFAULT '{}'::jsonb,
  price_monthly_usd  numeric(10,2) NOT NULL DEFAULT 0,
  is_active          boolean NOT NULL DEFAULT true,
  sort_order         integer NOT NULL DEFAULT 0,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

INSERT INTO public.plans (slug, name, tokens_monthly, max_users, included_agents, price_monthly_usd, sort_order) VALUES
  ('free',     'Free',      50000,    1, ARRAY['ramona','cactus-ia'],            0,   0),
  ('starter',  'Starter',   500000,   3, ARRAY['ramona','cactus-ia'],            29,  1),
  ('business', 'Business',  2000000, 10, ARRAY['ramona','cactus-ia'],            99,  2),
  ('agency',   'Agency',    0,        0, ARRAY['*'],                             299, 3)
ON CONFLICT (slug) DO NOTHING;

-- ── Organizaciones (cuenta raíz) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  slug        text UNIQUE,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations(owner_id);

-- ── Empresas (= tenant) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                 uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name                   text NOT NULL,
  slug                   text,
  industry               text,
  plan_id                uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  license_count          integer NOT NULL DEFAULT 0,    -- 0 = ilimitado; se sincroniza con Stripe
  branding               jsonb   NOT NULL DEFAULT '{}'::jsonb,
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now(),
  UNIQUE (org_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_companies_org  ON public.companies(org_id);
CREATE INDEX IF NOT EXISTS idx_companies_plan ON public.companies(plan_id);

-- ── Membresías (puente usuario↔empresa + RBAC + cuota) ──────────────────────
CREATE TABLE IF NOT EXISTS public.memberships (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id    uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role          text NOT NULL DEFAULT 'owner'
                CHECK (role IN ('owner','admin','marketing','ventas','legal','ops','invitado','cliente')),
  tokens_quota  bigint NOT NULL DEFAULT 0,              -- 0 = sin tope individual
  status        text   NOT NULL DEFAULT 'active',       -- active | invited | suspended
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (user_id, company_id)
);
CREATE INDEX IF NOT EXISTS idx_memberships_user    ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_company ON public.memberships(company_id);

-- ── Empresa activa del usuario (selector de workspace, Acción 2) ────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS primary_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- ── updated_at automático (la función ya existe desde 033; OR REPLACE = self-contained)
CREATE OR REPLACE FUNCTION public.cactus_set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['organizations','companies','memberships','plans'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %1$s_updated_at ON public.%1$I;', t);
    EXECUTE format(
      'CREATE TRIGGER %1$s_updated_at BEFORE UPDATE ON public.%1$I
         FOR EACH ROW EXECUTE FUNCTION public.cactus_set_updated_at();', t);
  END LOOP;
END $$;

-- ============================================================================
-- Helpers de aislamiento (SECURITY DEFINER → leen sin RLS → SIN recursión).
-- Patrón: evita el "infinite recursion in policy" (ver migración 032).
--   *_ids()        → alcanzable por MEMBRESÍA  (para LECTURA)
--   *_owned_*_ids()→ del DUEÑO de la organización (para ESCRITURA del plano de control)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cactus_company_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.memberships WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.cactus_org_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id FROM public.organizations o WHERE o.owner_id = auth.uid()
  UNION
  SELECT c.org_id FROM public.companies c
   WHERE c.id IN (SELECT m.company_id FROM public.memberships m WHERE m.user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.cactus_owned_org_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.organizations WHERE owner_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.cactus_owned_company_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id FROM public.companies c
   JOIN public.organizations o ON o.id = c.org_id
  WHERE o.owner_id = auth.uid();
$$;

-- ============================================================================
-- RLS de las tablas nuevas (plano de control: lectura por membresía, escritura
-- solo del dueño de la org / super-admin).
-- ============================================================================

-- Planes: lectura pública autenticada; escritura solo super-admin.
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS plans_read   ON public.plans;
DROP POLICY IF EXISTS plans_admin  ON public.plans;
CREATE POLICY plans_read  ON public.plans FOR SELECT USING (true);
CREATE POLICY plans_admin ON public.plans FOR ALL
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Organizaciones: leen dueño + miembros; ESCRIBE/BORRA solo el dueño (o super).
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS organizations_access ON public.organizations;  -- versión previa (FOR ALL)
DROP POLICY IF EXISTS organizations_select ON public.organizations;
DROP POLICY IF EXISTS organizations_manage ON public.organizations;
CREATE POLICY organizations_select ON public.organizations FOR SELECT
  USING (
    owner_id = auth.uid()
    OR id IN (SELECT public.cactus_org_ids())
    OR public.is_super_admin()
  );
CREATE POLICY organizations_manage ON public.organizations FOR ALL
  USING (owner_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_super_admin());

-- Empresas: leen miembros + dueño de la org; ESCRIBE/BORRA solo el dueño (o super).
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS companies_access ON public.companies;          -- versión previa (FOR ALL)
DROP POLICY IF EXISTS companies_select ON public.companies;
DROP POLICY IF EXISTS companies_manage ON public.companies;
CREATE POLICY companies_select ON public.companies FOR SELECT
  USING (
    id IN (SELECT public.cactus_company_ids())
    OR org_id IN (SELECT public.cactus_org_ids())
    OR public.is_super_admin()
  );
CREATE POLICY companies_manage ON public.companies FOR ALL
  USING (org_id IN (SELECT public.cactus_owned_org_ids()) OR public.is_super_admin())
  WITH CHECK (org_id IN (SELECT public.cactus_owned_org_ids()) OR public.is_super_admin());

-- Membresías: el usuario ve las suyas y las de sus empresas (helper, sin recursión).
-- ESCRIBE/BORRA solo el dueño de la org de esa empresa (o super): impide que
-- cualquiera se auto-inserte como 'owner' en una empresa ajena (toma de tenant).
-- El alta de equipo se hará con service-role/función SECURITY DEFINER (RBAC, Acción 8).
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS memberships_select ON public.memberships;
DROP POLICY IF EXISTS memberships_write  ON public.memberships;       -- versión previa (insegura)
DROP POLICY IF EXISTS memberships_manage ON public.memberships;
CREATE POLICY memberships_select ON public.memberships FOR SELECT
  USING (
    user_id = auth.uid()
    OR company_id IN (SELECT public.cactus_company_ids())
    OR public.is_super_admin()
  );
CREATE POLICY memberships_manage ON public.memberships FOR ALL
  USING (company_id IN (SELECT public.cactus_owned_company_ids()) OR public.is_super_admin())
  WITH CHECK (company_id IN (SELECT public.cactus_owned_company_ids()) OR public.is_super_admin());

-- ============================================================================
-- company_id (NULLABLE) + índice + RLS aditiva en las 7 tablas existentes.
-- Estas SÍ son datos de trabajo del tenant: un miembro de la empresa puede
-- leer/escribir (FOR ALL). NO tocamos las políticas `_owner` (existen por:
-- 033 → projects/tasks/messages/deliverables; 031 + src/lib/cactus/schema-sql.ts
-- → brand_kits/knowledge_items/credit_ledger). Añadimos una política PERMISIVA
-- `_access` (RLS combina permisivas en OR) que suma el acceso por empresa y el
-- super-admin SIN quitar el acceso por dueño.
-- to_regclass(...) IS NOT NULL → resiliente si alguna tabla aún no existe.
-- ============================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'cactus_projects','cactus_project_tasks','cactus_project_messages',
    'cactus_deliverables','cactus_brand_kits','cactus_knowledge_items','cactus_credit_ledger'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS company_id uuid
           REFERENCES public.companies(id) ON DELETE SET NULL;', t);
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS idx_%1$s_company ON public.%1$I(company_id);', t);

      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
      EXECUTE format('DROP POLICY IF EXISTS %1$s_access ON public.%1$I;', t);
      EXECUTE format($f$
        CREATE POLICY %1$s_access ON public.%1$I
          FOR ALL USING (
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

-- ============================================================================
-- Re-parenteo: crea org+empresa default por usuario y devuelve su company_id.
-- Idempotente: si el usuario ya tiene membresía, devuelve esa empresa.
-- SECURITY DEFINER → siembra/lee sin tropezar con RLS (también la usan el
-- backfill y el trigger de signup). pg_advisory_xact_lock por-usuario evita
-- duplicados ante llamadas concurrentes o reintentos tras fallo parcial.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cactus_ensure_default_company(p_user uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company uuid;
  v_org     uuid;
  v_label   text;
  v_plan    uuid;
BEGIN
  IF p_user IS NULL THEN
    RETURN NULL;
  END IF;

  -- Candado por-usuario (vive hasta el fin de la transacción): serializa el
  -- "probe + insert" para que dos llamadas simultáneas no creen dos empresas.
  PERFORM pg_advisory_xact_lock(hashtext('cactus_default_company'), hashtext(p_user::text));

  -- ¿ya tiene empresa? → devuelve la más antigua (desempate determinista)
  SELECT company_id INTO v_company
    FROM public.memberships
   WHERE user_id = p_user
   ORDER BY created_at ASC, company_id ASC
   LIMIT 1;
  IF v_company IS NOT NULL THEN
    RETURN v_company;
  END IF;

  -- etiqueta legible: nombre del perfil → parte local del email → fallback
  SELECT COALESCE(NULLIF(p.full_name, ''), NULLIF(split_part(u.email, '@', 1), ''), 'Mi empresa')
    INTO v_label
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
   WHERE u.id = p_user;
  v_label := COALESCE(v_label, 'Mi empresa');

  SELECT id INTO v_plan FROM public.plans WHERE slug = 'free' LIMIT 1;

  INSERT INTO public.organizations (owner_id, name)
    VALUES (p_user, v_label)
    RETURNING id INTO v_org;

  INSERT INTO public.companies (org_id, name, plan_id)
    VALUES (v_org, v_label, v_plan)
    RETURNING id INTO v_company;

  INSERT INTO public.memberships (user_id, company_id, role)
    VALUES (p_user, v_company, 'owner')
    ON CONFLICT (user_id, company_id) DO NOTHING;

  UPDATE public.profiles
     SET primary_company_id = v_company, updated_at = now()
   WHERE id = p_user AND primary_company_id IS NULL;

  RETURN v_company;
END $$;

-- ── Aprovisionamiento de NUEVOS usuarios (going-forward) ────────────────────
-- handle_new_user (001) inserta el profile en el signup; este trigger, AFTER
-- INSERT en profiles, le crea su org+empresa default. best-effort: si algo
-- falla, NO rompe el signup (solo deja WARNING).
CREATE OR REPLACE FUNCTION public.cactus_provision_new_profile()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  BEGIN
    PERFORM public.cactus_ensure_default_company(new.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'cactus_provision_new_profile: aprovisionamiento omitido para % (%).', new.id, SQLERRM;
  END;
  RETURN new;
END $$;

DROP TRIGGER IF EXISTS cactus_provision_on_profile ON public.profiles;
CREATE TRIGGER cactus_provision_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.cactus_provision_new_profile();

-- ── Backfill: re-parentea los datos EXISTENTES (idempotente) ────────────────
-- Guardado por to_regclass (coherente con el header): si faltan tablas cactus_*
-- (031/033 aún no aplicadas), omite el backfill en vez de fallar.
DO $$
DECLARE
  r         record;
  v_company uuid;
BEGIN
  IF to_regclass('public.cactus_projects')         IS NULL
     OR to_regclass('public.cactus_project_tasks')    IS NULL
     OR to_regclass('public.cactus_project_messages') IS NULL
     OR to_regclass('public.cactus_deliverables')     IS NULL
     OR to_regclass('public.cactus_brand_kits')       IS NULL
     OR to_regclass('public.cactus_knowledge_items')  IS NULL
     OR to_regclass('public.cactus_credit_ledger')    IS NULL THEN
    RAISE NOTICE '034: backfill omitido (faltan tablas cactus_*; aplica 031/033 primero).';
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
    ) s
    WHERE user_id IS NOT NULL
  LOOP
    v_company := public.cactus_ensure_default_company(r.user_id);
    IF v_company IS NOT NULL THEN
      UPDATE public.cactus_projects        SET company_id = v_company WHERE user_id = r.user_id AND company_id IS NULL;
      UPDATE public.cactus_project_tasks    SET company_id = v_company WHERE user_id = r.user_id AND company_id IS NULL;
      UPDATE public.cactus_project_messages SET company_id = v_company WHERE user_id = r.user_id AND company_id IS NULL;
      UPDATE public.cactus_deliverables     SET company_id = v_company WHERE user_id = r.user_id AND company_id IS NULL;
      UPDATE public.cactus_brand_kits       SET company_id = v_company WHERE user_id = r.user_id AND company_id IS NULL;
      UPDATE public.cactus_knowledge_items  SET company_id = v_company WHERE user_id = r.user_id AND company_id IS NULL;
      UPDATE public.cactus_credit_ledger    SET company_id = v_company WHERE user_id = r.user_id AND company_id IS NULL;
    END IF;
  END LOOP;
END $$;
