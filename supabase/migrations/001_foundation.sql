-- ============================================
-- CACTUS PLATFORM - Foundation Schema
-- ============================================

-- Profiles (extends Supabase Auth users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'es',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- App catalog
CREATE TABLE public.apps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  category TEXT,
  base_price_monthly INTEGER DEFAULT 0,
  base_price_yearly INTEGER DEFAULT 0,
  has_free_trial BOOLEAN DEFAULT false,
  trial_days INTEGER DEFAULT 0,
  status TEXT DEFAULT 'coming-soon',
  features JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tiers per app (e.g., Ramona has Starter/Creator/Business/Agency)
CREATE TABLE public.app_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT REFERENCES public.apps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT,
  price_monthly INTEGER DEFAULT 0,
  price_yearly INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]',
  limits JSONB DEFAULT '{}',
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User subscriptions to apps
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  app_id TEXT REFERENCES public.apps(id) NOT NULL,
  tier_id UUID REFERENCES public.app_tiers(id),
  status TEXT DEFAULT 'trialing',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, app_id)
);

-- Indexes
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_app ON public.subscriptions(app_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_app_tiers_app ON public.app_tiers(app_id);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Apps: public read for everyone
CREATE POLICY "Anyone can read apps"
  ON public.apps FOR SELECT
  TO authenticated, anon
  USING (true);

-- Tiers: public read for everyone
CREATE POLICY "Anyone can read tiers"
  ON public.app_tiers FOR SELECT
  TO authenticated, anon
  USING (true);

-- Subscriptions: users can read their own
CREATE POLICY "Users can read own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage subscriptions (for Stripe webhooks)
CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Super Admin Helpers
-- ============================================

-- Function to check if current user is a super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Super admins can read all profiles
CREATE POLICY "Super admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_super_admin());

-- Super admins can update all profiles (e.g., change roles)
CREATE POLICY "Super admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_super_admin());

-- Super admins can manage apps
CREATE POLICY "Super admins can manage apps"
  ON public.apps FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Super admins can manage tiers
CREATE POLICY "Super admins can manage tiers"
  ON public.app_tiers FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Super admins can read all subscriptions
CREATE POLICY "Super admins can read all subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (public.is_super_admin());
