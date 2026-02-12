-- ============================================
-- RAMONA BATCH CONTENT GENERATION
-- ============================================

-- Table for tracking batch generation jobs
CREATE TABLE IF NOT EXISTS rm_batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES rm_brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  config JSONB NOT NULL DEFAULT '{}',
  -- config structure: { count, platforms[], types[], themes[], tone_override }
  progress INTEGER DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  CONSTRAINT rm_batch_jobs_progress_check CHECK (progress >= 0 AND progress <= total)
);

-- Indexes for batch jobs
CREATE INDEX IF NOT EXISTS rm_batch_jobs_brand_idx ON rm_batch_jobs(brand_id);
CREATE INDEX IF NOT EXISTS rm_batch_jobs_user_idx ON rm_batch_jobs(user_id);
CREATE INDEX IF NOT EXISTS rm_batch_jobs_status_idx ON rm_batch_jobs(status);
CREATE INDEX IF NOT EXISTS rm_batch_jobs_created_idx ON rm_batch_jobs(created_at DESC);

-- RLS for batch jobs
ALTER TABLE rm_batch_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own batch jobs
CREATE POLICY "Users can view own batch jobs"
  ON rm_batch_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create batch jobs for their brands
CREATE POLICY "Users can create batch jobs"
  ON rm_batch_jobs FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM rm_brands
      WHERE id = brand_id AND user_id = auth.uid()
    )
  );

-- Users can cancel their own batch jobs
CREATE POLICY "Users can update own batch jobs"
  ON rm_batch_jobs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add batch_job_id to contents table
ALTER TABLE rm_contents
ADD COLUMN IF NOT EXISTS batch_job_id UUID REFERENCES rm_batch_jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS rm_contents_batch_idx ON rm_contents(batch_job_id);

-- Function to update batch job progress
CREATE OR REPLACE FUNCTION update_batch_job_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- When a content is created for a batch job, update progress
  IF NEW.batch_job_id IS NOT NULL THEN
    UPDATE rm_batch_jobs
    SET progress = (
      SELECT COUNT(*) FROM rm_contents
      WHERE batch_job_id = NEW.batch_job_id
    )
    WHERE id = NEW.batch_job_id;

    -- Check if batch is complete
    UPDATE rm_batch_jobs
    SET status = 'completed', completed_at = now()
    WHERE id = NEW.batch_job_id
    AND progress >= total
    AND status = 'processing';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update progress
DROP TRIGGER IF EXISTS batch_progress_trigger ON rm_contents;
CREATE TRIGGER batch_progress_trigger
  AFTER INSERT ON rm_contents
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_job_progress();
