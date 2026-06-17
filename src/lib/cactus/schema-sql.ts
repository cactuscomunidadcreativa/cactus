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
`;
