-- ============================================================================
-- 031 · Cactus Comunidad Creativa — esquema del ecosistema multiagente
-- Idempotente. Marca (Brand Kit), conocimiento, campañas + variantes emocionales,
-- créditos (wallet + ledger), costos de modelo y activación de agentes por usuario.
-- RLS: cada usuario ve/escribe lo suyo; el service_role pasa por encima.
-- ============================================================================

-- ── Brand Kit (Cerebro / Tramo 2) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cactus_brand_kits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  industry    text,
  offer       text,
  audience    text,
  tone        text,
  values      text[] DEFAULT '{}',
  colors      jsonb DEFAULT '{}'::jsonb,
  voice       jsonb DEFAULT '{}'::jsonb,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cactus_brand_kits_user ON public.cactus_brand_kits(user_id);

-- ── Knowledge Vault (Cerebro / Tramo 2) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cactus_knowledge_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_kit_id  uuid REFERENCES public.cactus_brand_kits(id) ON DELETE CASCADE,
  title         text NOT NULL,
  kind          text DEFAULT 'note',          -- note | url | pdf | doc | faq
  content       text,
  source_url    text,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cactus_knowledge_user ON public.cactus_knowledge_items(user_id);

-- ── Campañas + variantes emocionales (Tramo 3, persistencia) ────────────────
CREATE TABLE IF NOT EXISTS public.cactus_campaigns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_kit_id  uuid REFERENCES public.cactus_brand_kits(id) ON DELETE SET NULL,
  name          text,
  brief         jsonb NOT NULL DEFAULT '{}'::jsonb,
  objective     text,
  channel       text,
  credits_used  integer DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cactus_campaigns_user ON public.cactus_campaigns(user_id);

CREATE TABLE IF NOT EXISTS public.cactus_message_variants (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid NOT NULL REFERENCES public.cactus_campaigns(id) ON DELETE CASCADE,
  profile      text NOT NULL,
  emotion      text,
  headline     text,
  body         text,
  cta          text,
  rationale    text,
  axes         jsonb DEFAULT '{}'::jsonb,
  performance  jsonb DEFAULT '{}'::jsonb,      -- feedback de conversión (aprendizaje)
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cactus_variants_campaign ON public.cactus_message_variants(campaign_id);

-- ── Créditos: wallet + ledger (sostenibilidad / Tramo 5-6) ──────────────────
CREATE TABLE IF NOT EXISTS public.cactus_credit_wallets (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan        text DEFAULT 'starter',
  balance     integer DEFAULT 0,
  byok        boolean DEFAULT false,           -- trae sus propias llaves => ilimitado
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cactus_credit_ledger (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta       integer NOT NULL,                -- negativo = consumo, positivo = recarga
  reason      text,
  agent_slug  text,
  model       text,
  cost_usd    numeric(10,5),
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cactus_ledger_user ON public.cactus_credit_ledger(user_id);

-- ── Llaves API por workspace (BYOK / Tramo enterprise) ──────────────────────
CREATE TABLE IF NOT EXISTS public.cactus_api_keys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider    text NOT NULL,                   -- anthropic | openai | kling | elevenlabs ...
  key_enc     text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- ── Costos de modelo (espejo de src/lib/cactus/credits.ts) ──────────────────
CREATE TABLE IF NOT EXISTS public.cactus_model_costs (
  model          text PRIMARY KEY,
  input_per_m    numeric(10,4),
  output_per_m   numeric(10,4),
  per_image      numeric(10,4),
  per_video_sec  numeric(10,4)
);
INSERT INTO public.cactus_model_costs (model, input_per_m, output_per_m, per_image, per_video_sec) VALUES
  ('claude', 3, 15, NULL, NULL),
  ('claude-haiku', 0.8, 4, NULL, NULL),
  ('gpt', 2.5, 10, NULL, NULL),
  ('gpt-mini', 0.15, 0.6, NULL, NULL),
  ('gemini', 1.25, 5, NULL, NULL),
  ('gpt-image', NULL, NULL, 0.04, NULL),
  ('kling', NULL, NULL, NULL, 0.10),
  ('runway', NULL, NULL, NULL, 0.12),
  ('veo', NULL, NULL, NULL, 0.20)
ON CONFLICT (model) DO NOTHING;

-- ── Activación de agentes por usuario (marketplace / packs) ─────────────────
CREATE TABLE IF NOT EXISTS public.cactus_agent_activations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_slug  text NOT NULL,
  status      text DEFAULT 'active',           -- active | trial | paused
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, agent_slug)
);

-- ── RLS: dueño por user_id ──────────────────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'cactus_brand_kits','cactus_knowledge_items','cactus_campaigns',
    'cactus_credit_wallets','cactus_credit_ledger','cactus_api_keys','cactus_agent_activations'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format($f$
      DROP POLICY IF EXISTS %1$s_owner ON public.%1$I;
      CREATE POLICY %1$s_owner ON public.%1$I
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    $f$, t);
  END LOOP;
END $$;

-- variantes: acceso vía dueño de la campaña
ALTER TABLE public.cactus_message_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cactus_variants_owner ON public.cactus_message_variants;
CREATE POLICY cactus_variants_owner ON public.cactus_message_variants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.cactus_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.cactus_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid())
  );

-- model_costs: lectura pública autenticada
ALTER TABLE public.cactus_model_costs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cactus_model_costs_read ON public.cactus_model_costs;
CREATE POLICY cactus_model_costs_read ON public.cactus_model_costs FOR SELECT USING (true);
