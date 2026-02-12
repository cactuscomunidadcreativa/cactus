-- TUNA Category Mappings: AI-powered budget to expense mapping
-- This table stores the relationship between budget categories and EEFF expense concepts

-- Table for category mappings
CREATE TABLE IF NOT EXISTS tuna_category_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES tuna_campaigns(id) ON DELETE CASCADE,

  -- Budget side
  budget_category TEXT NOT NULL,
  budget_process TEXT CHECK (budget_process IN ('almacigo', 'campo_definitivo', 'packing')),

  -- EEFF side
  eeff_concept TEXT NOT NULL,

  -- AI mapping metadata
  confidence INTEGER DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  match_type TEXT DEFAULT 'suggested' CHECK (match_type IN ('exact', 'suggested', 'manual', 'ignored')),
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Unique constraint per campaign
  UNIQUE(campaign_id, budget_category, budget_process)
);

-- Table to store EEFF expense totals by concept (for Real calculation)
CREATE TABLE IF NOT EXISTS tuna_eeff_totals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES tuna_campaigns(id) ON DELETE CASCADE,

  eeff_concept TEXT NOT NULL,
  total_amount DECIMAL(15,2) DEFAULT 0,

  -- Breakdown by OP type
  almacigo_total DECIMAL(15,2) DEFAULT 0,
  campo_total DECIMAL(15,2) DEFAULT 0,
  packing_total DECIMAL(15,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(campaign_id, eeff_concept)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tuna_mappings_campaign ON tuna_category_mappings(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tuna_mappings_confirmed ON tuna_category_mappings(campaign_id, confirmed);
CREATE INDEX IF NOT EXISTS idx_tuna_eeff_campaign ON tuna_eeff_totals(campaign_id);

-- RLS Policies
ALTER TABLE tuna_category_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuna_eeff_totals ENABLE ROW LEVEL SECURITY;

-- Users can manage their own mappings (through campaign ownership)
CREATE POLICY "Users can manage their campaign mappings"
  ON tuna_category_mappings
  FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM tuna_campaigns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their campaign EEFF totals"
  ON tuna_eeff_totals
  FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM tuna_campaigns WHERE user_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_tuna_mapping_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tuna_mappings_updated
  BEFORE UPDATE ON tuna_category_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_tuna_mapping_timestamp();

CREATE TRIGGER trigger_tuna_eeff_updated
  BEFORE UPDATE ON tuna_eeff_totals
  FOR EACH ROW
  EXECUTE FUNCTION update_tuna_mapping_timestamp();
