-- ============================================
-- RAMONA SOCIAL MODULE - Schema
-- Migration 004
-- ============================================

-- Brand voice profiles (onboarding output)
CREATE TABLE public.rm_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  industry TEXT,
  tone JSONB DEFAULT '[]',
  audience JSONB DEFAULT '{}',
  competitors JSONB DEFAULT '[]',
  value_proposition TEXT,
  example_content JSONB DEFAULT '[]',
  keywords JSONB DEFAULT '[]',
  forbidden_words JSONB DEFAULT '[]',
  visual_style JSONB DEFAULT '{}',
  logo_url TEXT,
  platforms JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Content items (posts, captions, ideas)
CREATE TABLE public.rm_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.rm_brands(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]',
  hashtags JSONB DEFAULT '[]',
  platform TEXT NOT NULL CHECK (platform IN ('instagram','facebook','twitter','linkedin','tiktok','multi')),
  content_type TEXT DEFAULT 'post' CHECK (content_type IN ('post','story','reel','carousel','thread','article')),
  status TEXT DEFAULT 'idea' CHECK (status IN ('idea','draft','review','approved','scheduled','published','archived')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  ai_model TEXT,
  ai_prompt_used TEXT,
  generation_id UUID,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI generation log
CREATE TABLE public.rm_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.rm_brands(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  prompt TEXT NOT NULL,
  system_prompt TEXT,
  model TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('claude','openai')),
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  response TEXT,
  error TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Monthly usage tracking
CREATE TABLE public.rm_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  brand_id UUID REFERENCES public.rm_brands(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,
  content_count INTEGER DEFAULT 0,
  generation_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, brand_id, month)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_rm_brands_user ON public.rm_brands(user_id);
CREATE INDEX idx_rm_contents_brand ON public.rm_contents(brand_id);
CREATE INDEX idx_rm_contents_user ON public.rm_contents(user_id);
CREATE INDEX idx_rm_contents_status ON public.rm_contents(status);
CREATE INDEX idx_rm_contents_scheduled ON public.rm_contents(scheduled_at);
CREATE INDEX idx_rm_contents_platform ON public.rm_contents(platform);
CREATE INDEX idx_rm_generations_brand ON public.rm_generations(brand_id);
CREATE INDEX idx_rm_generations_user ON public.rm_generations(user_id);
CREATE INDEX idx_rm_usage_user_month ON public.rm_usage(user_id, month);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.rm_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rm_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rm_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rm_usage ENABLE ROW LEVEL SECURITY;

-- Helper: check if user owns a brand
CREATE OR REPLACE FUNCTION public.rm_owns_brand(check_brand_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rm_brands
    WHERE id = check_brand_id
    AND user_id = auth.uid()
  );
$$;

-- Brands policies
CREATE POLICY "Users can read own brands" ON public.rm_brands
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create brands" ON public.rm_brands
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own brands" ON public.rm_brands
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own brands" ON public.rm_brands
  FOR DELETE USING (user_id = auth.uid());

-- Contents policies
CREATE POLICY "Users can read own contents" ON public.rm_contents
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create contents" ON public.rm_contents
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.rm_owns_brand(brand_id));
CREATE POLICY "Users can update own contents" ON public.rm_contents
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own contents" ON public.rm_contents
  FOR DELETE USING (user_id = auth.uid());

-- Generations policies
CREATE POLICY "Users can read own generations" ON public.rm_generations
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create generations" ON public.rm_generations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Usage policies
CREATE POLICY "Users can read own usage" ON public.rm_usage
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can upsert own usage" ON public.rm_usage
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own usage" ON public.rm_usage
  FOR UPDATE USING (user_id = auth.uid());
