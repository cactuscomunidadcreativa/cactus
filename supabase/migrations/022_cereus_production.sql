-- ============================================================
-- CEREUS Production Pipeline — Migration 022
-- Adds pattern_data to garments + production tracking tables
-- ============================================================

-- 1. Add pattern_data column to garments
ALTER TABLE cereus_garments
  ADD COLUMN IF NOT EXISTS pattern_data JSONB DEFAULT NULL;

-- 2. Production stages enum
DO $$ BEGIN
  CREATE TYPE cereus_production_stage AS ENUM (
    'pattern',    -- Crear moldes/patrones
    'cutting',    -- Corte de tela
    'sewing',     -- Costura
    'finishing',   -- Acabados (botones, cierres, bordados)
    'quality',    -- Control de calidad
    'pressing',   -- Planchado/vapor
    'packaging',  -- Empaque
    'delivered'   -- Entregado
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Production log type
DO $$ BEGIN
  CREATE TYPE cereus_log_type AS ENUM (
    'stage_start',
    'stage_complete',
    'observation',
    'issue',
    'delay',
    'rework',
    'quality_check',
    'photo'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Add current_stage to orders
ALTER TABLE cereus_orders
  ADD COLUMN IF NOT EXISTS current_stage cereus_production_stage DEFAULT 'pattern',
  ADD COLUMN IF NOT EXISTS stage_started_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS pattern_data JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tech_pack_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS assigned_artisan TEXT DEFAULT NULL;

-- 5. Production logs table
CREATE TABLE IF NOT EXISTS cereus_production_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES cereus_orders(id) ON DELETE CASCADE,
  maison_id UUID NOT NULL REFERENCES app_clients(id),
  workshop_id UUID REFERENCES cereus_workshops(id),

  stage cereus_production_stage NOT NULL,
  log_type cereus_log_type NOT NULL DEFAULT 'observation',

  title TEXT NOT NULL,
  content TEXT,

  -- Time tracking
  estimated_hours NUMERIC(6,2) DEFAULT 0,
  actual_hours NUMERIC(6,2) DEFAULT 0,

  -- Assignment
  assigned_to TEXT,
  completed_by TEXT,

  -- Issue tracking
  is_critical BOOLEAN DEFAULT false,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  -- Media
  photo_urls TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Quality checks table
CREATE TABLE IF NOT EXISTS cereus_quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES cereus_orders(id) ON DELETE CASCADE,
  maison_id UUID NOT NULL REFERENCES app_clients(id),

  inspector TEXT,
  check_date TIMESTAMPTZ DEFAULT NOW(),

  -- Checklist items: [{item: string, passed: boolean, notes: string}]
  checklist JSONB DEFAULT '[]',

  overall_result TEXT DEFAULT 'pending', -- pending, passed, failed, rework
  score NUMERIC(3,1), -- 0-10

  photo_urls TEXT[] DEFAULT '{}',
  notes TEXT,

  -- Rework
  rework_required BOOLEAN DEFAULT false,
  rework_instructions TEXT,
  rework_completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Workshop notes table (taller observations)
CREATE TABLE IF NOT EXISTS cereus_workshop_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES cereus_orders(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL REFERENCES cereus_workshops(id),
  maison_id UUID NOT NULL REFERENCES app_clients(id),

  note_date TIMESTAMPTZ DEFAULT NOW(),
  note_type TEXT NOT NULL DEFAULT 'observation', -- observation, delay, issue, quality, rework, material, measurement
  stage cereus_production_stage,

  content TEXT NOT NULL,
  is_critical BOOLEAN DEFAULT false,

  -- Resolution
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,

  -- Media
  photo_urls TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_production_logs_order ON cereus_production_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_stage ON cereus_production_logs(stage);
CREATE INDEX IF NOT EXISTS idx_production_logs_maison ON cereus_production_logs(maison_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_order ON cereus_quality_checks(order_id);
CREATE INDEX IF NOT EXISTS idx_workshop_notes_order ON cereus_workshop_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_workshop_notes_workshop ON cereus_workshop_notes(workshop_id);

-- 9. RLS policies
ALTER TABLE cereus_production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_workshop_notes ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (app uses service client)
CREATE POLICY IF NOT EXISTS "Service role full access production_logs"
  ON cereus_production_logs FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service role full access quality_checks"
  ON cereus_quality_checks FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service role full access workshop_notes"
  ON cereus_workshop_notes FOR ALL
  USING (true) WITH CHECK (true);
