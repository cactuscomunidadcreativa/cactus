-- ============================================
-- 016: PITA Co-Creation — Threads & Attachments
-- Enables persistent comments with names and file uploads
-- ============================================

-- Threaded comments per section
CREATE TABLE IF NOT EXISTS pita_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id TEXT NOT NULL,
  presentation_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  parent_id UUID REFERENCES pita_threads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pita_threads_section
  ON pita_threads(presentation_id, section_id);

CREATE INDEX IF NOT EXISTS idx_pita_threads_parent
  ON pita_threads(parent_id);

-- File attachments (linked to threads or standalone per section)
CREATE TABLE IF NOT EXISTS pita_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES pita_threads(id) ON DELETE SET NULL,
  section_id TEXT NOT NULL,
  presentation_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pita_attachments_section
  ON pita_attachments(presentation_id, section_id);

CREATE INDEX IF NOT EXISTS idx_pita_attachments_thread
  ON pita_attachments(thread_id);

-- RLS: Public access for anonymous co-creation (matches existing PITA pattern)
ALTER TABLE pita_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pita_attachments ENABLE ROW LEVEL SECURITY;

-- Threads: anyone can read and create
CREATE POLICY "pita_threads_public_read" ON pita_threads
  FOR SELECT USING (true);

CREATE POLICY "pita_threads_public_insert" ON pita_threads
  FOR INSERT WITH CHECK (true);

-- Attachments: anyone can read and create
CREATE POLICY "pita_attachments_public_read" ON pita_attachments
  FOR SELECT USING (true);

CREATE POLICY "pita_attachments_public_insert" ON pita_attachments
  FOR INSERT WITH CHECK (true);

-- Storage bucket for PITA uploads (run manually in Supabase dashboard if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('pita-uploads', 'pita-uploads', true);
