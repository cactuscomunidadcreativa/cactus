-- ============================================
-- RAMONA VIDEO STUDIO
-- ============================================

-- Table for video generation jobs
CREATE TABLE IF NOT EXISTS rm_video_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES rm_brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES rm_contents(id) ON DELETE SET NULL, -- optional, if created from existing content

  -- Video configuration
  script TEXT NOT NULL,
  video_type TEXT NOT NULL CHECK (video_type IN ('text-to-video', 'avatar', 'faceless', 'carousel')),
  style JSONB NOT NULL DEFAULT '{}',
  -- style structure: { template, colors[], font, transitions, aspectRatio }

  -- Generated assets
  voiceover_url TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,

  -- Job status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'rendering', 'completed', 'failed')),
  progress INTEGER DEFAULT 0,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  CONSTRAINT rm_video_jobs_progress_check CHECK (progress >= 0 AND progress <= 100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS rm_video_jobs_brand_idx ON rm_video_jobs(brand_id);
CREATE INDEX IF NOT EXISTS rm_video_jobs_user_idx ON rm_video_jobs(user_id);
CREATE INDEX IF NOT EXISTS rm_video_jobs_status_idx ON rm_video_jobs(status);
CREATE INDEX IF NOT EXISTS rm_video_jobs_created_idx ON rm_video_jobs(created_at DESC);

-- RLS
ALTER TABLE rm_video_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video jobs"
  ON rm_video_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create video jobs"
  ON rm_video_jobs FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM rm_brands
      WHERE id = brand_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own video jobs"
  ON rm_video_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Video templates table
CREATE TABLE IF NOT EXISTS rm_video_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('reel', 'story', 'ad', 'explainer', 'promo')),
  thumbnail_url TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  -- config structure: { duration, aspectRatio, transitions[], elements[] }
  is_premium BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default templates
INSERT INTO rm_video_templates (name, display_name, description, category, config, sort_order) VALUES
  ('minimal-text', 'Minimal Text', 'Clean text animations on solid color', 'reel', '{"duration": 15, "aspectRatio": "9:16", "transitions": ["fade"], "style": "minimal"}', 1),
  ('bold-headlines', 'Bold Headlines', 'Eye-catching headline animations', 'reel', '{"duration": 15, "aspectRatio": "9:16", "transitions": ["slide"], "style": "bold"}', 2),
  ('story-carousel', 'Story Carousel', 'Multi-slide story format', 'story', '{"duration": 30, "aspectRatio": "9:16", "transitions": ["swipe"], "style": "carousel"}', 3),
  ('product-promo', 'Product Promo', 'Showcase products with animations', 'promo', '{"duration": 30, "aspectRatio": "1:1", "transitions": ["zoom"], "style": "promo"}', 4),
  ('explainer-simple', 'Simple Explainer', 'Educational content format', 'explainer', '{"duration": 60, "aspectRatio": "16:9", "transitions": ["fade"], "style": "educational"}', 5)
ON CONFLICT DO NOTHING;

-- Public read access for templates
ALTER TABLE rm_video_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view video templates"
  ON rm_video_templates FOR SELECT
  USING (true);
