-- ============================================
-- CACTUS PLATFORM - Admin & Configuration
-- ============================================

-- Platform-wide configuration (API keys, settings)
CREATE TABLE public.platform_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  encrypted BOOLEAN DEFAULT false,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Token/generation budgets per user per app per month
CREATE TABLE public.token_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  app_id TEXT REFERENCES public.apps(id) ON DELETE CASCADE NOT NULL,
  monthly_token_limit INTEGER DEFAULT -1,        -- -1 = unlimited
  monthly_tokens_used INTEGER DEFAULT 0,
  monthly_generation_limit INTEGER DEFAULT -1,   -- -1 = unlimited
  monthly_generations_used INTEGER DEFAULT 0,
  month TEXT NOT NULL,                           -- '2025-01-01' format
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, app_id, month)
);

-- Admin audit log
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,                     -- 'config', 'budget', 'user', 'app'
  target_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_token_budgets_user ON public.token_budgets(user_id);
CREATE INDEX idx_token_budgets_app ON public.token_budgets(app_id);
CREATE INDEX idx_token_budgets_month ON public.token_budgets(month);
CREATE INDEX idx_token_budgets_lookup ON public.token_budgets(user_id, app_id, month);
CREATE INDEX idx_audit_log_admin ON public.admin_audit_log(admin_id);
CREATE INDEX idx_audit_log_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_target ON public.admin_audit_log(target_type, target_id);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- platform_config: only super_admin can read/write
CREATE POLICY "Super admins can manage config"
  ON public.platform_config FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- token_budgets: super_admin full access, users can read their own
CREATE POLICY "Users can read own budgets"
  ON public.token_budgets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all budgets"
  ON public.token_budgets FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Service role can update budgets (for API routes)
CREATE POLICY "Service role can manage budgets"
  ON public.token_budgets FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- admin_audit_log: only super_admin
CREATE POLICY "Super admins can read audit log"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admins can insert audit log"
  ON public.admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

-- Service role can insert audit log (for API routes)
CREATE POLICY "Service role can insert audit log"
  ON public.admin_audit_log FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================
-- Helper function: get config value
-- ============================================

CREATE OR REPLACE FUNCTION public.get_platform_config(config_key TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  SELECT value INTO result
  FROM public.platform_config
  WHERE key = config_key;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- Seed default config entries
-- ============================================

INSERT INTO public.platform_config (key, value, encrypted, description) VALUES
  ('anthropic_api_key', '', true, 'Anthropic API key for Claude'),
  ('openai_api_key', '', true, 'OpenAI API key'),
  ('ai_default_provider', 'claude', false, 'Default AI provider (claude or openai)'),
  ('ai_fallback_enabled', 'true', false, 'Enable fallback to secondary AI provider'),
  ('global_monthly_token_limit', '-1', false, 'Global monthly token limit per user (-1 = unlimited)'),
  ('global_monthly_generation_limit', '-1', false, 'Global monthly generation limit per user (-1 = unlimited)')
ON CONFLICT (key) DO NOTHING;
