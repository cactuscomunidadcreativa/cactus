-- ============================================
-- PITA - Presentation & Feedback Vault
-- "Tu contenido en vitrina. Tu feedback bajo control."
-- ============================================

-- Presentations table
CREATE TABLE IF NOT EXISTS pita_presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  created_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  brand_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Presentation sections
CREATE TABLE IF NOT EXISTS pita_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID REFERENCES pita_presentations(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT NOT NULL DEFAULT '',
  section_type TEXT NOT NULL DEFAULT 'content',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reviewers (anonymous visitors with just a name)
CREATE TABLE IF NOT EXISTS pita_reviewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID REFERENCES pita_presentations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  session_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

-- Section feedback (reactions + comments)
CREATE TABLE IF NOT EXISTS pita_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES pita_sections(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES pita_reviewers(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reaction TEXT, -- 'like', 'dislike', 'love'
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pita_presentations_slug ON pita_presentations(slug);
CREATE INDEX IF NOT EXISTS idx_pita_sections_presentation ON pita_sections(presentation_id, order_index);
CREATE INDEX IF NOT EXISTS idx_pita_feedback_section ON pita_feedback(section_id);
CREATE INDEX IF NOT EXISTS idx_pita_reviewers_session ON pita_reviewers(session_token);
CREATE INDEX IF NOT EXISTS idx_pita_reviewers_presentation ON pita_reviewers(presentation_id);

-- RLS Policies
ALTER TABLE pita_presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pita_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE pita_reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pita_feedback ENABLE ROW LEVEL SECURITY;

-- Public read for active presentations (anyone with the link)
CREATE POLICY "Public read active presentations" ON pita_presentations
  FOR SELECT USING (is_active = true);

-- Owner can do everything with their presentations
CREATE POLICY "Owner manages presentations" ON pita_presentations
  FOR ALL USING (auth.uid() = created_by);

-- Public read sections of active presentations
CREATE POLICY "Public read sections" ON pita_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pita_presentations
      WHERE id = pita_sections.presentation_id AND is_active = true
    )
  );

-- Owner manages sections
CREATE POLICY "Owner manages sections" ON pita_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pita_presentations
      WHERE id = pita_sections.presentation_id AND auth.uid() = created_by
    )
  );

-- Anyone can create/read reviewers (anonymous feedback)
CREATE POLICY "Public reviewer access" ON pita_reviewers
  FOR ALL USING (true) WITH CHECK (true);

-- Anyone can create feedback, read all
CREATE POLICY "Public feedback access" ON pita_feedback
  FOR ALL USING (true) WITH CHECK (true);
