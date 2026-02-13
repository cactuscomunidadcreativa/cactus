-- ============================================================
-- CEREUS x PRIVAT - Emotional Algorithmic Atelier
-- Complete Database Schema
-- "The First Emotional Algorithmic Atelier in Latin America"
-- ============================================================
-- Depends on: 001_foundation.sql, 013_app_clients.sql
-- Integrates with: Agave (pricing), Tuna (financial), WeekFlow (production)
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================

CREATE TYPE cereus_client_role AS ENUM ('client', 'advisor', 'workshop', 'admin');
CREATE TYPE cereus_garment_status AS ENUM ('draft', 'design', 'approved', 'costing', 'in_production', 'quality_check', 'delivered', 'archived');
CREATE TYPE cereus_order_status AS ENUM ('pending', 'confirmed', 'cutting', 'sewing', 'finishing', 'quality_check', 'ready', 'delivered', 'cancelled');
CREATE TYPE cereus_payment_status AS ENUM ('pending', 'partial', 'paid', 'refunded');
CREATE TYPE cereus_body_zone AS ENUM ('upper', 'lower', 'full');
CREATE TYPE cereus_garment_category AS ENUM ('dress', 'gown', 'suit', 'blazer', 'coat', 'skirt', 'pants', 'blouse', 'shirt', 'jumpsuit', 'cape', 'corset', 'accessory', 'other');
CREATE TYPE cereus_material_type AS ENUM ('fabric', 'lining', 'trim', 'hardware', 'thread', 'interfacing', 'elastic', 'zipper', 'button', 'embellishment', 'other');
CREATE TYPE cereus_material_unit AS ENUM ('metro', 'yard', 'pieza', 'kg', 'rollo', 'par', 'set');
CREATE TYPE cereus_season AS ENUM ('spring_summer', 'fall_winter', 'resort', 'cruise', 'capsule', 'bridal', 'custom');
CREATE TYPE cereus_style_archetype AS ENUM ('classic_elegance', 'modern_minimalist', 'romantic_dreamer', 'bold_avant_garde', 'bohemian_free', 'power_executive', 'ethereal_goddess', 'structured_architectural');
CREATE TYPE cereus_warmth AS ENUM ('warm', 'cool', 'neutral');
CREATE TYPE cereus_closet_source AS ENUM ('order', 'external', 'gift', 'sample');
CREATE TYPE cereus_production_stage AS ENUM ('pattern', 'cutting', 'sewing', 'embroidery', 'finishing', 'pressing', 'quality_check', 'packaging');
CREATE TYPE cereus_audit_action AS ENUM ('create', 'update', 'delete', 'status_change', 'assign', 'upload', 'approve', 'reject', 'deliver');

-- ============================================================
-- 2. MAISON CONFIGURATION (Multi-tenant via app_clients)
-- ============================================================

-- CEREUS-specific config for each Maison (extends app_clients.config JSONB)
-- Usage: INSERT INTO app_clients (app_id, nombre, config) VALUES ('cereus', 'PRIVAT', {...})
-- The config JSONB should contain:
-- {
--   "maison_name": "PRIVAT",
--   "maison_tagline": "Emotional Algorithmic Atelier",
--   "default_currency": "USD",
--   "default_language": "es",
--   "margin_config": { "min": 0.30, "target": 0.50, "premium": 0.65 },
--   "ar_enabled": false,
--   "ai_photo_enabled": true,
--   "production_tracking": true,
--   "branding": { "logo_url": "", "primary_color": "#0A0A0A", "accent_color": "#C9A84C" }
-- }

-- ============================================================
-- 3. CLIENTS (Fashion clients of the Maison)
-- ============================================================

CREATE TABLE public.cereus_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maison_id UUID NOT NULL REFERENCES app_clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- nullable: not all clients have accounts

  -- Identity
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'MX',
  date_of_birth DATE,
  avatar_url TEXT,

  -- Classification
  role cereus_client_role DEFAULT 'client',
  vip_tier TEXT DEFAULT 'standard' CHECK (vip_tier IN ('standard', 'silver', 'gold', 'platinum', 'privat')),
  preferred_language TEXT DEFAULT 'es',
  preferred_contact TEXT DEFAULT 'whatsapp' CHECK (preferred_contact IN ('whatsapp', 'email', 'phone', 'in_person')),

  -- Advisor assignment
  assigned_advisor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Notes
  internal_notes TEXT,
  style_notes TEXT,

  -- Privacy
  consent_photos BOOLEAN DEFAULT false,
  consent_data BOOLEAN DEFAULT false,
  consent_marketing BOOLEAN DEFAULT false,

  -- State
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. BODY MEASUREMENTS (Versioned History)
-- ============================================================

CREATE TABLE public.cereus_body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES cereus_clients(id) ON DELETE CASCADE,
  measured_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Core measurements (cm)
  bust NUMERIC(6,2),
  underbust NUMERIC(6,2),
  waist NUMERIC(6,2),
  high_hip NUMERIC(6,2),
  hip NUMERIC(6,2),
  shoulder_width NUMERIC(6,2),
  arm_length NUMERIC(6,2),
  wrist NUMERIC(6,2),
  neck NUMERIC(6,2),
  torso_length NUMERIC(6,2),
  inseam NUMERIC(6,2),
  outseam NUMERIC(6,2),
  thigh NUMERIC(6,2),
  knee NUMERIC(6,2),
  calf NUMERIC(6,2),
  ankle NUMERIC(6,2),

  -- Derived / Additional
  height NUMERIC(6,2),
  weight NUMERIC(6,2),
  shoe_size TEXT,
  bra_size TEXT,

  -- Body shape analysis
  body_shape TEXT CHECK (body_shape IN ('hourglass', 'pear', 'apple', 'rectangle', 'inverted_triangle', 'athletic', NULL)),
  posture_notes TEXT,

  -- Adjustments
  notes TEXT,
  fit_preferences JSONB DEFAULT '{}', -- {"ease": "relaxed", "length_preference": "long", "shoulder_fit": "natural"}

  -- Versioning
  is_current BOOLEAN DEFAULT true,
  superseded_by UUID REFERENCES cereus_body_measurements(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. EMOTIONAL INTELLIGENCE
-- ============================================================

-- Emotional Profile (questionnaire responses + AI analysis)
CREATE TABLE public.cereus_emotional_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES cereus_clients(id) ON DELETE CASCADE,

  -- Questionnaire Responses (JSONB for flexibility)
  questionnaire_responses JSONB DEFAULT '{}',
  -- Example structure:
  -- {
  --   "color_preferences": ["black", "deep_red", "ivory"],
  --   "texture_preferences": ["silk", "velvet", "cashmere"],
  --   "mood_dressing": "empowered",
  --   "fashion_icons": ["Coco Chanel", "Alexander McQueen"],
  --   "occasions_priority": ["gala", "business", "cocktail"],
  --   "comfort_vs_impact": 7, // 1-10 scale
  --   "minimalism_vs_maximalism": 3,
  --   "classic_vs_trendy": 4,
  --   "personal_manifesto": "I dress to command the room"
  -- }

  -- AI-Derived Style Profile
  style_archetypes cereus_style_archetype[] DEFAULT '{}',
  primary_archetype cereus_style_archetype,
  archetype_scores JSONB DEFAULT '{}', -- {"classic_elegance": 0.85, "power_executive": 0.72, ...}

  -- Mood & Season
  emotional_season TEXT CHECK (emotional_season IN ('spring', 'summer', 'autumn', 'winter', NULL)),
  mood_tags TEXT[] DEFAULT '{}', -- ['confident', 'mysterious', 'romantic']
  energy_level TEXT CHECK (energy_level IN ('serene', 'balanced', 'vibrant', 'intense', NULL)),

  -- AI Summary
  style_summary TEXT, -- AI-generated narrative
  advisor_notes TEXT, -- Human advisor interpretation

  -- Versioning
  is_current BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Color Palettes (generated or curated)
CREATE TABLE public.cereus_color_palettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES cereus_clients(id) ON DELETE CASCADE, -- null = system palette
  maison_id UUID NOT NULL REFERENCES app_clients(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Colors (array of hex codes)
  colors JSONB NOT NULL DEFAULT '[]',
  -- Example: [
  --   {"hex": "#0A0A0A", "name": "Noir Profond", "role": "primary"},
  --   {"hex": "#C9A84C", "name": "Or Vieux", "role": "accent"},
  --   {"hex": "#F5F0EB", "name": "Ivoire Chaud", "role": "neutral"},
  --   {"hex": "#8B2500", "name": "Bordeaux", "role": "statement"}
  -- ]

  -- Classification
  warmth cereus_warmth DEFAULT 'neutral',
  season cereus_season,
  is_seasonal BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false, -- true = pre-defined Maison palette

  -- Source
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ai_generated', 'photo_analysis', 'questionnaire')),
  source_reference TEXT, -- ID of photo analysis or questionnaire that generated it

  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. AI PHOTO INTELLIGENCE
-- ============================================================

CREATE TABLE public.cereus_ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES cereus_clients(id) ON DELETE CASCADE,
  analyzed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Input
  image_url TEXT NOT NULL,
  image_type TEXT DEFAULT 'full_body' CHECK (image_type IN ('full_body', 'upper_body', 'detail', 'outfit', 'fabric', 'inspiration')),

  -- AI Analysis Results
  silhouette_data JSONB DEFAULT '{}',
  -- {
  --   "body_proportions": {"torso_ratio": 0.45, "leg_ratio": 0.55},
  --   "detected_shape": "hourglass",
  --   "shoulder_line": "sloped",
  --   "waist_definition": "defined",
  --   "posture": "upright"
  -- }

  color_analysis JSONB DEFAULT '{}',
  -- {
  --   "skin_undertone": "warm",
  --   "hair_color_family": "dark",
  --   "dominant_colors": ["#2C1A0E", "#D4A574", "#1A1A1A"],
  --   "recommended_palette": "autumn_warm",
  --   "avoid_colors": ["#FFE4E1", "#E6E6FA"]
  -- }

  style_analysis JSONB DEFAULT '{}',
  -- {
  --   "current_style": "business_casual",
  --   "detected_brands": [],
  --   "fit_assessment": "slightly_oversized",
  --   "proportion_suggestions": ["longer_torso_emphasis", "defined_waist"]
  -- }

  recommendations JSONB DEFAULT '[]',
  -- [
  --   {"type": "silhouette", "suggestion": "A-line dresses", "confidence": 0.92},
  --   {"type": "color", "suggestion": "Deep burgundy tones", "confidence": 0.88},
  --   {"type": "fabric", "suggestion": "Structured fabrics", "confidence": 0.85}
  -- ]

  -- AI Provider Info
  ai_provider TEXT DEFAULT 'claude' CHECK (ai_provider IN ('claude', 'openai', 'manual')),
  ai_model TEXT,
  confidence_score NUMERIC(4,3), -- 0.000 to 1.000

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. COLLECTIONS & GARMENTS
-- ============================================================

-- Collections
CREATE TABLE public.cereus_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maison_id UUID NOT NULL REFERENCES app_clients(id) ON DELETE CASCADE,
  designer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  code TEXT, -- "FW25", "SS26-B"
  description TEXT,
  season cereus_season NOT NULL,
  year INTEGER NOT NULL,

  -- Visual
  cover_image_url TEXT,
  mood_board_urls JSONB DEFAULT '[]', -- array of image URLs
  inspiration_notes TEXT,

  -- Status
  status TEXT DEFAULT 'concept' CHECK (status IN ('concept', 'design', 'production', 'launched', 'archived')),

  -- Financial targets
  target_pieces INTEGER,
  target_revenue NUMERIC(12,2),
  avg_price_point NUMERIC(10,2),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Garments (Base designs)
CREATE TABLE public.cereus_garments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maison_id UUID NOT NULL REFERENCES app_clients(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES cereus_collections(id) ON DELETE SET NULL,
  designer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Identity
  name TEXT NOT NULL,
  code TEXT, -- "PV-D001" (PRIVAT-Dress-001)
  description TEXT,
  category cereus_garment_category NOT NULL,
  body_zone cereus_body_zone DEFAULT 'full',

  -- Design
  tech_sheet_url TEXT,
  pattern_url TEXT,
  images JSONB DEFAULT '[]', -- [{"url": "...", "type": "front"}, {"url": "...", "type": "back"}]

  -- Base costing
  base_cost NUMERIC(10,2) DEFAULT 0, -- calculated from BOM
  base_labor_hours NUMERIC(6,2) DEFAULT 0,
  base_labor_cost NUMERIC(10,2) DEFAULT 0,
  complexity_level INTEGER DEFAULT 1 CHECK (complexity_level BETWEEN 1 AND 5),

  -- Pricing (Agave integration)
  base_price NUMERIC(10,2), -- selling price before customization
  margin_target NUMERIC(5,4) DEFAULT 0.50, -- 50% target margin for haute couture

  -- Status
  status cereus_garment_status DEFAULT 'draft',

  -- Tags for search
  tags TEXT[] DEFAULT '{}', -- ['evening', 'structured', 'silk']
  season cereus_season,
  year INTEGER,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 8. MATERIALS VAULT
-- ============================================================

-- Material catalog
CREATE TABLE public.cereus_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maison_id UUID NOT NULL REFERENCES app_clients(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  code TEXT, -- "SLK-001"
  description TEXT,
  type cereus_material_type NOT NULL,
  subtype TEXT, -- "charmeuse", "organza", "tweed"

  -- Sourcing
  supplier TEXT,
  supplier_code TEXT,
  origin_country TEXT,
  lead_time_days INTEGER,

  -- Cost
  unit_cost NUMERIC(10,2) NOT NULL,
  unit cereus_material_unit NOT NULL,
  currency TEXT DEFAULT 'USD',
  min_order_qty NUMERIC(10,2),

  -- Physical properties
  width_cm NUMERIC(6,2), -- for fabrics
  weight_gsm NUMERIC(8,2), -- grams per square meter
  composition TEXT, -- "100% Silk", "70% Wool, 30% Cashmere"
  care_instructions TEXT,

  -- Visual
  image_url TEXT,
  swatch_url TEXT,
  color_hex TEXT, -- primary color for filtering

  -- Stock
  current_stock NUMERIC(10,2) DEFAULT 0,
  stock_unit cereus_material_unit,
  reorder_point NUMERIC(10,2),

  -- Classification
  season_appropriate cereus_season[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bill of Materials (garment ↔ material)
CREATE TABLE public.cereus_garment_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garment_id UUID NOT NULL REFERENCES cereus_garments(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES cereus_materials(id) ON DELETE RESTRICT,

  -- Usage
  quantity NUMERIC(10,3) NOT NULL,
  unit cereus_material_unit NOT NULL,
  waste_factor NUMERIC(4,3) DEFAULT 1.10, -- 10% waste default

  -- Calculated
  unit_cost NUMERIC(10,2), -- snapshot of material cost at time of BOM creation
  total_cost NUMERIC(10,2), -- quantity * unit_cost * waste_factor

  -- Notes
  notes TEXT, -- "Main body fabric", "Lining - bodice only"
  is_optional BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. VARIANTS (Customized versions of garments)
-- ============================================================

CREATE TABLE public.cereus_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garment_id UUID NOT NULL REFERENCES cereus_garments(id) ON DELETE CASCADE,
  client_id UUID REFERENCES cereus_clients(id) ON DELETE SET NULL, -- null = catalog variant

  -- Customization
  variant_name TEXT, -- "Noir Edition", "Bridal Custom"
  color TEXT,
  color_hex TEXT,
  primary_material_id UUID REFERENCES cereus_materials(id) ON DELETE SET NULL,

  -- Custom materials override
  material_overrides JSONB DEFAULT '[]',
  -- [{"original_material_id": "...", "replacement_material_id": "...", "reason": "Client preference"}]

  -- Extras / Customizations
  extras JSONB DEFAULT '{}',
  -- {
  --   "embroidery": true,
  --   "embroidery_detail": "Gold thread monogram on interior",
  --   "length_adjustment_cm": -5,
  --   "custom_lining": true,
  --   "special_buttons": "Mother of pearl"
  -- }

  -- Images (layered composites)
  preview_image_url TEXT,
  layer_images JSONB DEFAULT '[]',
  -- [
  --   {"layer": "base", "url": "...", "z_index": 0},
  --   {"layer": "color", "url": "...", "z_index": 1},
  --   {"layer": "detail", "url": "...", "z_index": 2}
  -- ]

  -- Pricing
  material_cost NUMERIC(10,2) DEFAULT 0,
  labor_cost NUMERIC(10,2) DEFAULT 0,
  extras_cost NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(10,2) DEFAULT 0,  -- material + labor + extras
  final_price NUMERIC(10,2) DEFAULT 0, -- selling price with margin
  margin_actual NUMERIC(5,4),

  -- AR
  ar_model_url TEXT,
  ar_enabled BOOLEAN DEFAULT false,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'proposed', 'approved', 'ordered', 'archived')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 10. AR MIRROR SESSIONS
-- ============================================================

CREATE TABLE public.cereus_ar_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES cereus_clients(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES cereus_variants(id) ON DELETE CASCADE,

  -- Session data
  screenshot_url TEXT,
  device_info JSONB DEFAULT '{}', -- {"type": "tablet", "browser": "Chrome", "ar_engine": "webxr"}
  duration_seconds INTEGER,

  -- Feedback
  client_approved BOOLEAN,
  client_notes TEXT,
  adjustments_requested JSONB DEFAULT '[]',
  -- [{"area": "hem_length", "request": "2cm shorter"}, {"area": "neckline", "request": "slightly deeper"}]

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 11. WORKSHOPS (Production partners)
-- ============================================================

CREATE TABLE public.cereus_workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maison_id UUID NOT NULL REFERENCES app_clients(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  code TEXT, -- "WS-CDMX-01"
  location TEXT,
  city TEXT,
  country TEXT DEFAULT 'MX',

  -- Contact
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,

  -- Capabilities
  specialties TEXT[] DEFAULT '{}', -- ['tailoring', 'embroidery', 'leather', 'couture_finish']
  capacity_monthly INTEGER, -- max pieces per month
  avg_lead_time_days INTEGER,
  quality_rating NUMERIC(3,2) CHECK (quality_rating BETWEEN 0 AND 5),

  -- Financials
  labor_rate_hourly NUMERIC(8,2),
  currency TEXT DEFAULT 'MXN',

  -- Status
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 12. ORDERS
-- ============================================================

CREATE TABLE public.cereus_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maison_id UUID NOT NULL REFERENCES app_clients(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES cereus_clients(id) ON DELETE RESTRICT,
  variant_id UUID NOT NULL REFERENCES cereus_variants(id) ON DELETE RESTRICT,
  workshop_id UUID REFERENCES cereus_workshops(id) ON DELETE SET NULL,

  -- Order details
  order_number TEXT NOT NULL, -- "PV-2025-001"
  order_date TIMESTAMPTZ DEFAULT now(),

  -- Pricing
  total_price NUMERIC(10,2) NOT NULL,
  deposit_amount NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  discount_reason TEXT,
  final_amount NUMERIC(10,2) NOT NULL, -- total - discount

  -- Payment
  payment_status cereus_payment_status DEFAULT 'pending',
  payments JSONB DEFAULT '[]',
  -- [
  --   {"date": "2025-01-15", "amount": 5000, "method": "transfer", "reference": "TX123"},
  --   {"date": "2025-02-01", "amount": 5000, "method": "card", "reference": "TX456"}
  -- ]

  -- Delivery
  estimated_delivery DATE,
  actual_delivery DATE,
  delivery_address TEXT,
  delivery_method TEXT DEFAULT 'pickup' CHECK (delivery_method IN ('pickup', 'delivery', 'shipping')),

  -- Fittings
  fittings JSONB DEFAULT '[]',
  -- [
  --   {"date": "2025-01-20", "type": "first_fitting", "notes": "Waist needs 1cm adjustment", "photos": ["url1"]},
  --   {"date": "2025-02-05", "type": "final_fitting", "notes": "Perfect fit", "photos": ["url2"]}
  -- ]

  -- Production status
  status cereus_order_status DEFAULT 'pending',
  current_stage cereus_production_stage,
  stage_started_at TIMESTAMPTZ,

  -- Client communication
  client_notes TEXT,
  internal_notes TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'rush', 'vip')),

  -- Tracking
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 13. PRODUCTION TRACKING (Saguaro-style)
-- ============================================================

-- Production stages log
CREATE TABLE public.cereus_production_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES cereus_orders(id) ON DELETE CASCADE,
  workshop_id UUID REFERENCES cereus_workshops(id) ON DELETE SET NULL,

  -- Stage info
  stage cereus_production_stage NOT NULL,
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed', 'issue', 'skipped')),

  -- Progress
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  estimated_hours NUMERIC(6,2),
  actual_hours NUMERIC(6,2),

  -- Personnel
  started_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_artisan TEXT,

  -- Notes & Issues
  notes TEXT,
  issues JSONB DEFAULT '[]',
  -- [{"type": "material_defect", "description": "Fabric stain on panel 3", "severity": "minor", "resolved": true}]

  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Production evidence (photos, documents)
CREATE TABLE public.cereus_production_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES cereus_orders(id) ON DELETE CASCADE,
  production_log_id UUID REFERENCES cereus_production_log(id) ON DELETE SET NULL,

  -- File
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'image' CHECK (file_type IN ('image', 'video', 'document', 'pdf')),
  file_name TEXT,
  file_size INTEGER,

  -- Context
  stage cereus_production_stage,
  description TEXT,
  is_quality_check BOOLEAN DEFAULT false,

  -- Upload
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 14. QUALITY CONTROL
-- ============================================================

CREATE TABLE public.cereus_quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES cereus_orders(id) ON DELETE CASCADE,
  inspector_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Checklist
  checklist JSONB DEFAULT '[]',
  -- [
  --   {"item": "Seam integrity", "passed": true, "notes": ""},
  --   {"item": "Color consistency", "passed": true, "notes": ""},
  --   {"item": "Button alignment", "passed": false, "notes": "Button 3 is 2mm off center"},
  --   {"item": "Hem evenness", "passed": true, "notes": ""},
  --   {"item": "Lining attachment", "passed": true, "notes": ""},
  --   {"item": "Overall finish", "passed": true, "notes": "Excellent craftsmanship"}
  -- ]

  -- Result
  overall_result TEXT DEFAULT 'pending' CHECK (overall_result IN ('pending', 'passed', 'passed_with_notes', 'failed', 'rework_required')),
  score NUMERIC(4,2) CHECK (score BETWEEN 0 AND 10),

  -- Evidence
  photos JSONB DEFAULT '[]', -- ["url1", "url2"]
  notes TEXT,

  -- Rework
  rework_required BOOLEAN DEFAULT false,
  rework_instructions TEXT,
  rework_completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 15. DIGITAL CLOSET
-- ============================================================

CREATE TABLE public.cereus_closet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES cereus_clients(id) ON DELETE CASCADE,
  order_id UUID REFERENCES cereus_orders(id) ON DELETE SET NULL, -- null if external

  -- Item details
  garment_name TEXT NOT NULL,
  category cereus_garment_category,
  description TEXT,
  source cereus_closet_source DEFAULT 'order',
  brand TEXT, -- for external items

  -- Visual
  image_url TEXT,
  images JSONB DEFAULT '[]',

  -- Colors & Materials
  primary_color TEXT,
  color_hex TEXT,
  materials TEXT[], -- ['silk', 'lace']

  -- Usage tracking
  times_worn INTEGER DEFAULT 0,
  last_worn DATE,
  acquired_date DATE DEFAULT CURRENT_DATE,
  condition TEXT DEFAULT 'new' CHECK (condition IN ('new', 'excellent', 'good', 'fair', 'needs_repair')),

  -- Outfit planning
  occasions TEXT[] DEFAULT '{}', -- ['gala', 'business', 'cocktail']
  season_appropriate cereus_season[] DEFAULT '{}',
  outfit_compatible_ids UUID[] DEFAULT '{}', -- IDs of other closet items that pair well

  -- Care
  care_instructions TEXT,
  last_cleaned DATE,
  alteration_history JSONB DEFAULT '[]',
  -- [{"date": "2025-03-15", "type": "hemming", "notes": "Shortened 3cm", "cost": 500}]

  -- Status
  activo BOOLEAN DEFAULT true, -- false = archived/donated
  archived_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 16. ADVISOR / FASHION RECOMMENDATIONS
-- ============================================================

CREATE TABLE public.cereus_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES cereus_clients(id) ON DELETE CASCADE,
  advisor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Context
  occasion TEXT,
  season cereus_season,
  budget_range JSONB, -- {"min": 5000, "max": 15000, "currency": "USD"}

  -- Recommendations
  recommended_garments JSONB DEFAULT '[]',
  -- [
  --   {"garment_id": "...", "variant_id": "...", "reason": "Perfect for your body type", "priority": 1},
  --   {"garment_id": "...", "variant_id": null, "reason": "New collection piece", "priority": 2}
  -- ]

  recommended_outfits JSONB DEFAULT '[]',
  -- [
  --   {"name": "Gala Night", "items": ["closet_id_1", "closet_id_2", "new_garment_id"], "notes": "Pair with gold accessories"}
  -- ]

  -- AI-generated
  ai_generated BOOLEAN DEFAULT false,
  ai_reasoning TEXT,

  -- Interaction
  client_viewed BOOLEAN DEFAULT false,
  client_feedback TEXT,
  client_rating INTEGER CHECK (client_rating BETWEEN 1 AND 5),

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 17. FINANCIAL SYNC (Agave + Tuna Integration)
-- ============================================================

CREATE TABLE public.cereus_financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maison_id UUID NOT NULL REFERENCES app_clients(id) ON DELETE CASCADE,
  order_id UUID REFERENCES cereus_orders(id) ON DELETE SET NULL,

  -- Type
  record_type TEXT NOT NULL CHECK (record_type IN ('material_cost', 'labor_cost', 'overhead', 'revenue', 'adjustment')),

  -- Amounts
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  exchange_rate NUMERIC(10,4) DEFAULT 1,
  amount_usd NUMERIC(12,2), -- normalized

  -- Classification
  category TEXT, -- 'fabric', 'labor', 'shipping', 'commission'
  subcategory TEXT,

  -- Period
  period_month INTEGER, -- 1-12
  period_year INTEGER,

  -- Reference to external systems
  agave_product_id UUID, -- reference to agave_products if synced
  tuna_campaign_id UUID, -- reference to tuna_campaigns if synced

  -- Budget vs Actual
  budget_amount NUMERIC(12,2),
  variance NUMERIC(12,2),
  variance_percent NUMERIC(8,4),

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Margin analysis per order (post-delivery)
CREATE TABLE public.cereus_margin_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES cereus_orders(id) ON DELETE CASCADE,

  -- Planned
  planned_material_cost NUMERIC(10,2),
  planned_labor_cost NUMERIC(10,2),
  planned_overhead NUMERIC(10,2),
  planned_total_cost NUMERIC(10,2),
  planned_price NUMERIC(10,2),
  planned_margin NUMERIC(5,4),

  -- Actual
  actual_material_cost NUMERIC(10,2),
  actual_labor_cost NUMERIC(10,2),
  actual_overhead NUMERIC(10,2),
  actual_total_cost NUMERIC(10,2),
  actual_price NUMERIC(10,2),
  actual_margin NUMERIC(5,4),

  -- Deviation
  cost_deviation NUMERIC(10,2),
  cost_deviation_percent NUMERIC(8,4),
  margin_deviation NUMERIC(5,4),

  -- Analysis
  deviation_reasons JSONB DEFAULT '[]',
  -- [{"category": "material", "reason": "Silk price increase", "amount": 500}]

  recommendations TEXT,
  analyzed_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 18. NOTIFICATIONS
-- ============================================================

CREATE TABLE public.cereus_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maison_id UUID NOT NULL REFERENCES app_clients(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'order_status', 'fitting_reminder', 'delivery_ready',
    'quality_issue', 'new_recommendation', 'payment_due',
    'new_collection', 'measurement_reminder', 'ar_session_ready',
    'production_update', 'system'
  )),

  -- Context
  entity_type TEXT, -- 'order', 'client', 'garment', etc.
  entity_id UUID,
  action_url TEXT,

  -- Delivery
  channel TEXT DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'whatsapp', 'push')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- State
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  archived BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 19. AUDIT LOG
-- ============================================================

CREATE TABLE public.cereus_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maison_id UUID NOT NULL REFERENCES app_clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- What happened
  action cereus_audit_action NOT NULL,
  entity_type TEXT NOT NULL, -- 'order', 'garment', 'client', 'variant', 'measurement', etc.
  entity_id UUID NOT NULL,

  -- Details
  old_data JSONB, -- previous state (for updates)
  new_data JSONB, -- new state
  description TEXT, -- human-readable: "Changed order PV-2025-001 status from cutting to sewing"

  -- Context
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 20. INDEXES
-- ============================================================

-- Clients
CREATE INDEX idx_cereus_clients_maison ON cereus_clients(maison_id);
CREATE INDEX idx_cereus_clients_user ON cereus_clients(user_id);
CREATE INDEX idx_cereus_clients_advisor ON cereus_clients(assigned_advisor_id);
CREATE INDEX idx_cereus_clients_vip ON cereus_clients(vip_tier);
CREATE INDEX idx_cereus_clients_activo ON cereus_clients(maison_id, activo);
CREATE INDEX idx_cereus_clients_email ON cereus_clients(email);

-- Body measurements
CREATE INDEX idx_cereus_measurements_client ON cereus_body_measurements(client_id);
CREATE INDEX idx_cereus_measurements_current ON cereus_body_measurements(client_id, is_current) WHERE is_current = true;

-- Emotional profiles
CREATE INDEX idx_cereus_emotional_client ON cereus_emotional_profiles(client_id);
CREATE INDEX idx_cereus_emotional_current ON cereus_emotional_profiles(client_id, is_current) WHERE is_current = true;

-- Color palettes
CREATE INDEX idx_cereus_palettes_client ON cereus_color_palettes(client_id);
CREATE INDEX idx_cereus_palettes_maison ON cereus_color_palettes(maison_id);

-- AI analyses
CREATE INDEX idx_cereus_ai_client ON cereus_ai_analyses(client_id);

-- Collections
CREATE INDEX idx_cereus_collections_maison ON cereus_collections(maison_id);
CREATE INDEX idx_cereus_collections_season ON cereus_collections(season, year);

-- Garments
CREATE INDEX idx_cereus_garments_maison ON cereus_garments(maison_id);
CREATE INDEX idx_cereus_garments_collection ON cereus_garments(collection_id);
CREATE INDEX idx_cereus_garments_status ON cereus_garments(status);
CREATE INDEX idx_cereus_garments_category ON cereus_garments(category);
CREATE INDEX idx_cereus_garments_tags ON cereus_garments USING gin(tags);

-- Materials
CREATE INDEX idx_cereus_materials_maison ON cereus_materials(maison_id);
CREATE INDEX idx_cereus_materials_type ON cereus_materials(type);
CREATE INDEX idx_cereus_materials_supplier ON cereus_materials(supplier);
CREATE INDEX idx_cereus_materials_activo ON cereus_materials(maison_id, activo);
CREATE INDEX idx_cereus_materials_tags ON cereus_materials USING gin(tags);

-- BOM
CREATE INDEX idx_cereus_bom_garment ON cereus_garment_materials(garment_id);
CREATE INDEX idx_cereus_bom_material ON cereus_garment_materials(material_id);

-- Variants
CREATE INDEX idx_cereus_variants_garment ON cereus_variants(garment_id);
CREATE INDEX idx_cereus_variants_client ON cereus_variants(client_id);

-- AR Sessions
CREATE INDEX idx_cereus_ar_client ON cereus_ar_sessions(client_id);
CREATE INDEX idx_cereus_ar_variant ON cereus_ar_sessions(variant_id);

-- Workshops
CREATE INDEX idx_cereus_workshops_maison ON cereus_workshops(maison_id);
CREATE INDEX idx_cereus_workshops_activo ON cereus_workshops(activo);

-- Orders
CREATE INDEX idx_cereus_orders_maison ON cereus_orders(maison_id);
CREATE INDEX idx_cereus_orders_client ON cereus_orders(client_id);
CREATE INDEX idx_cereus_orders_workshop ON cereus_orders(workshop_id);
CREATE INDEX idx_cereus_orders_status ON cereus_orders(status);
CREATE INDEX idx_cereus_orders_number ON cereus_orders(order_number);
CREATE INDEX idx_cereus_orders_delivery ON cereus_orders(estimated_delivery);
CREATE INDEX idx_cereus_orders_payment ON cereus_orders(payment_status);

-- Production log
CREATE INDEX idx_cereus_production_order ON cereus_production_log(order_id);
CREATE INDEX idx_cereus_production_stage ON cereus_production_log(stage);

-- Production evidence
CREATE INDEX idx_cereus_evidence_order ON cereus_production_evidence(order_id);
CREATE INDEX idx_cereus_evidence_log ON cereus_production_evidence(production_log_id);

-- Quality checks
CREATE INDEX idx_cereus_qc_order ON cereus_quality_checks(order_id);

-- Closet
CREATE INDEX idx_cereus_closet_client ON cereus_closet_items(client_id);
CREATE INDEX idx_cereus_closet_category ON cereus_closet_items(category);
CREATE INDEX idx_cereus_closet_occasions ON cereus_closet_items USING gin(occasions);

-- Recommendations
CREATE INDEX idx_cereus_recs_client ON cereus_recommendations(client_id);
CREATE INDEX idx_cereus_recs_advisor ON cereus_recommendations(advisor_id);

-- Financial records
CREATE INDEX idx_cereus_financial_maison ON cereus_financial_records(maison_id);
CREATE INDEX idx_cereus_financial_order ON cereus_financial_records(order_id);
CREATE INDEX idx_cereus_financial_period ON cereus_financial_records(period_year, period_month);

-- Margin analysis
CREATE INDEX idx_cereus_margin_order ON cereus_margin_analysis(order_id);

-- Notifications
CREATE INDEX idx_cereus_notif_recipient ON cereus_notifications(recipient_id);
CREATE INDEX idx_cereus_notif_unread ON cereus_notifications(recipient_id, read) WHERE read = false;
CREATE INDEX idx_cereus_notif_type ON cereus_notifications(type);

-- Audit log
CREATE INDEX idx_cereus_audit_maison ON cereus_audit_log(maison_id);
CREATE INDEX idx_cereus_audit_user ON cereus_audit_log(user_id);
CREATE INDEX idx_cereus_audit_entity ON cereus_audit_log(entity_type, entity_id);
CREATE INDEX idx_cereus_audit_created ON cereus_audit_log(created_at DESC);

-- ============================================================
-- 21. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE cereus_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_emotional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_color_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_garments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_garment_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_ar_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_production_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_production_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_closet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_margin_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 22. HELPER FUNCTIONS
-- ============================================================

-- Check if user belongs to a CEREUS maison
CREATE OR REPLACE FUNCTION public.user_belongs_to_cereus_maison(p_maison_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM app_client_users
    WHERE client_id = p_maison_id
    AND user_id = auth.uid()
    AND activo = true
  ) OR public.is_super_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get user's CEREUS maison ID
CREATE OR REPLACE FUNCTION public.get_user_cereus_maison()
RETURNS UUID AS $$
DECLARE
  result UUID;
BEGIN
  SELECT c.id INTO result
  FROM app_clients c
  JOIN app_client_users cu ON cu.client_id = c.id
  WHERE cu.user_id = auth.uid()
    AND c.app_id = 'cereus'
    AND c.activo = true
    AND cu.activo = true
  LIMIT 1;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get user's role within their CEREUS maison
CREATE OR REPLACE FUNCTION public.get_user_cereus_role()
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  SELECT cu.rol INTO result
  FROM app_client_users cu
  JOIN app_clients c ON c.id = cu.client_id
  WHERE cu.user_id = auth.uid()
    AND c.app_id = 'cereus'
    AND c.activo = true
    AND cu.activo = true
  LIMIT 1;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Calculate garment cost from BOM
CREATE OR REPLACE FUNCTION public.calculate_cereus_garment_cost(p_garment_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_material_cost NUMERIC(10,2);
  v_labor_cost NUMERIC(10,2);
  v_total NUMERIC(10,2);
BEGIN
  -- Sum materials from BOM
  SELECT COALESCE(SUM(gm.quantity * m.unit_cost * gm.waste_factor), 0)
  INTO v_material_cost
  FROM cereus_garment_materials gm
  JOIN cereus_materials m ON m.id = gm.material_id
  WHERE gm.garment_id = p_garment_id;

  -- Get labor cost from garment
  SELECT COALESCE(base_labor_cost, 0)
  INTO v_labor_cost
  FROM cereus_garments
  WHERE id = p_garment_id;

  v_total := v_material_cost + v_labor_cost;

  RETURN jsonb_build_object(
    'material_cost', v_material_cost,
    'labor_cost', v_labor_cost,
    'total_cost', v_total,
    'calculated_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate next order number
CREATE OR REPLACE FUNCTION public.generate_cereus_order_number(p_maison_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_year TEXT;
  v_count INTEGER;
BEGIN
  v_prefix := 'PV'; -- Could be dynamic per maison
  v_year := TO_CHAR(now(), 'YYYY');

  SELECT COUNT(*) + 1 INTO v_count
  FROM cereus_orders
  WHERE maison_id = p_maison_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM now());

  RETURN v_prefix || '-' || v_year || '-' || LPAD(v_count::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 23. RLS POLICIES - Maison-scoped access
-- ============================================================

-- Pattern: All CEREUS tables are scoped by maison_id
-- Users see data from their maison only
-- Super admins see everything

-- Clients
CREATE POLICY "Maison users can view their clients" ON cereus_clients
  FOR SELECT TO authenticated
  USING (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Maison admins can manage clients" ON cereus_clients
  FOR ALL TO authenticated
  USING (user_belongs_to_cereus_maison(maison_id) AND (get_user_cereus_role() IN ('admin') OR is_super_admin()))
  WITH CHECK (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Service role full access on clients" ON cereus_clients
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Body measurements (accessed via client → maison chain)
CREATE POLICY "Maison users view measurements" ON cereus_body_measurements
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM cereus_clients WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Advisors manage measurements" ON cereus_body_measurements
  FOR ALL TO authenticated
  USING (client_id IN (SELECT id FROM cereus_clients WHERE user_belongs_to_cereus_maison(maison_id)))
  WITH CHECK (client_id IN (SELECT id FROM cereus_clients WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Service role full access on measurements" ON cereus_body_measurements
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Collections
CREATE POLICY "Maison users view collections" ON cereus_collections
  FOR SELECT TO authenticated USING (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Maison users manage collections" ON cereus_collections
  FOR ALL TO authenticated
  USING (user_belongs_to_cereus_maison(maison_id))
  WITH CHECK (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Service role full access on collections" ON cereus_collections
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Garments
CREATE POLICY "Maison users view garments" ON cereus_garments
  FOR SELECT TO authenticated USING (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Maison users manage garments" ON cereus_garments
  FOR ALL TO authenticated
  USING (user_belongs_to_cereus_maison(maison_id))
  WITH CHECK (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Service role full access on garments" ON cereus_garments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Materials
CREATE POLICY "Maison users view materials" ON cereus_materials
  FOR SELECT TO authenticated USING (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Maison users manage materials" ON cereus_materials
  FOR ALL TO authenticated
  USING (user_belongs_to_cereus_maison(maison_id))
  WITH CHECK (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Service role full access on materials" ON cereus_materials
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- BOM (via garment → maison)
CREATE POLICY "Maison users view BOM" ON cereus_garment_materials
  FOR SELECT TO authenticated
  USING (garment_id IN (SELECT id FROM cereus_garments WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Maison users manage BOM" ON cereus_garment_materials
  FOR ALL TO authenticated
  USING (garment_id IN (SELECT id FROM cereus_garments WHERE user_belongs_to_cereus_maison(maison_id)))
  WITH CHECK (garment_id IN (SELECT id FROM cereus_garments WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Service role full access on BOM" ON cereus_garment_materials
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Variants (via garment → maison)
CREATE POLICY "Maison users view variants" ON cereus_variants
  FOR SELECT TO authenticated
  USING (garment_id IN (SELECT id FROM cereus_garments WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Maison users manage variants" ON cereus_variants
  FOR ALL TO authenticated
  USING (garment_id IN (SELECT id FROM cereus_garments WHERE user_belongs_to_cereus_maison(maison_id)))
  WITH CHECK (garment_id IN (SELECT id FROM cereus_garments WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Service role full access on variants" ON cereus_variants
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Workshops
CREATE POLICY "Maison users view workshops" ON cereus_workshops
  FOR SELECT TO authenticated USING (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Maison admins manage workshops" ON cereus_workshops
  FOR ALL TO authenticated
  USING (user_belongs_to_cereus_maison(maison_id) AND (get_user_cereus_role() IN ('admin') OR is_super_admin()))
  WITH CHECK (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Service role full access on workshops" ON cereus_workshops
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Orders
CREATE POLICY "Maison users view orders" ON cereus_orders
  FOR SELECT TO authenticated USING (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Maison users manage orders" ON cereus_orders
  FOR ALL TO authenticated
  USING (user_belongs_to_cereus_maison(maison_id))
  WITH CHECK (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Service role full access on orders" ON cereus_orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Emotional profiles (via client)
CREATE POLICY "Maison users view emotional profiles" ON cereus_emotional_profiles
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM cereus_clients WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Maison users manage emotional profiles" ON cereus_emotional_profiles
  FOR ALL TO authenticated
  USING (client_id IN (SELECT id FROM cereus_clients WHERE user_belongs_to_cereus_maison(maison_id)))
  WITH CHECK (client_id IN (SELECT id FROM cereus_clients WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Service role full access on emotional profiles" ON cereus_emotional_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Color palettes
CREATE POLICY "Maison users view palettes" ON cereus_color_palettes
  FOR SELECT TO authenticated USING (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Maison users manage palettes" ON cereus_color_palettes
  FOR ALL TO authenticated
  USING (user_belongs_to_cereus_maison(maison_id))
  WITH CHECK (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Service role full access on palettes" ON cereus_color_palettes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- AI analyses (via client)
CREATE POLICY "Maison users view AI analyses" ON cereus_ai_analyses
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM cereus_clients WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Maison users manage AI analyses" ON cereus_ai_analyses
  FOR ALL TO authenticated
  USING (client_id IN (SELECT id FROM cereus_clients WHERE user_belongs_to_cereus_maison(maison_id)))
  WITH CHECK (client_id IN (SELECT id FROM cereus_clients WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Service role full access on AI analyses" ON cereus_ai_analyses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- AR sessions (via client)
CREATE POLICY "Maison users view AR sessions" ON cereus_ar_sessions
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM cereus_clients WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Service role full access on AR sessions" ON cereus_ar_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Production log (via order → maison)
CREATE POLICY "Maison users view production log" ON cereus_production_log
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM cereus_orders WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Maison users manage production log" ON cereus_production_log
  FOR ALL TO authenticated
  USING (order_id IN (SELECT id FROM cereus_orders WHERE user_belongs_to_cereus_maison(maison_id)))
  WITH CHECK (order_id IN (SELECT id FROM cereus_orders WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Service role full access on production log" ON cereus_production_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Production evidence
CREATE POLICY "Maison users view evidence" ON cereus_production_evidence
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM cereus_orders WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Maison users manage evidence" ON cereus_production_evidence
  FOR ALL TO authenticated
  USING (order_id IN (SELECT id FROM cereus_orders WHERE user_belongs_to_cereus_maison(maison_id)))
  WITH CHECK (order_id IN (SELECT id FROM cereus_orders WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Service role full access on evidence" ON cereus_production_evidence
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Quality checks
CREATE POLICY "Maison users view QC" ON cereus_quality_checks
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM cereus_orders WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Maison users manage QC" ON cereus_quality_checks
  FOR ALL TO authenticated
  USING (order_id IN (SELECT id FROM cereus_orders WHERE user_belongs_to_cereus_maison(maison_id)))
  WITH CHECK (order_id IN (SELECT id FROM cereus_orders WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Service role full access on QC" ON cereus_quality_checks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Closet items (via client)
CREATE POLICY "Maison users view closet" ON cereus_closet_items
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM cereus_clients WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Maison users manage closet" ON cereus_closet_items
  FOR ALL TO authenticated
  USING (client_id IN (SELECT id FROM cereus_clients WHERE user_belongs_to_cereus_maison(maison_id)))
  WITH CHECK (client_id IN (SELECT id FROM cereus_clients WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Service role full access on closet" ON cereus_closet_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Recommendations (via client)
CREATE POLICY "Maison users view recommendations" ON cereus_recommendations
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM cereus_clients WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Advisors manage recommendations" ON cereus_recommendations
  FOR ALL TO authenticated
  USING (client_id IN (SELECT id FROM cereus_clients WHERE user_belongs_to_cereus_maison(maison_id)))
  WITH CHECK (client_id IN (SELECT id FROM cereus_clients WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Service role full access on recommendations" ON cereus_recommendations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Financial records
CREATE POLICY "Maison users view financials" ON cereus_financial_records
  FOR SELECT TO authenticated USING (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Maison admins manage financials" ON cereus_financial_records
  FOR ALL TO authenticated
  USING (user_belongs_to_cereus_maison(maison_id) AND (get_user_cereus_role() IN ('admin') OR is_super_admin()))
  WITH CHECK (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Service role full access on financials" ON cereus_financial_records
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Margin analysis (via order)
CREATE POLICY "Maison users view margins" ON cereus_margin_analysis
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM cereus_orders WHERE user_belongs_to_cereus_maison(maison_id)));

CREATE POLICY "Service role full access on margins" ON cereus_margin_analysis
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Notifications (recipient-scoped)
CREATE POLICY "Users view own notifications" ON cereus_notifications
  FOR SELECT TO authenticated USING (recipient_id = auth.uid());

CREATE POLICY "Users update own notifications" ON cereus_notifications
  FOR UPDATE TO authenticated USING (recipient_id = auth.uid());

CREATE POLICY "Service role full access on notifications" ON cereus_notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Audit log (maison-scoped, read-only for non-admins)
CREATE POLICY "Maison admins view audit" ON cereus_audit_log
  FOR SELECT TO authenticated
  USING (user_belongs_to_cereus_maison(maison_id) AND (get_user_cereus_role() IN ('admin') OR is_super_admin()));

CREATE POLICY "Service role full access on audit" ON cereus_audit_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 24. STORAGE BUCKETS (run via Supabase Dashboard or API)
-- ============================================================
-- NOTE: Storage bucket creation requires Supabase client/dashboard
-- Buckets needed:
-- cereus-client-photos     (private, 10MB max, image/*)
-- cereus-garment-images    (private, 15MB max, image/*)
-- cereus-tech-sheets       (private, 20MB max, application/pdf, image/*)
-- cereus-production-evidence (private, 20MB max, image/*, video/mp4)
-- cereus-ar-models          (private, 50MB max, model/gltf+json, model/gltf-binary)
-- cereus-material-swatches   (private, 5MB max, image/*)

-- ============================================================
-- 25. SEED DATA - Emotional Questionnaire Template
-- ============================================================

-- This can be stored in app_clients config or as a separate config
-- The questionnaire structure for the Emotional Intelligence Layer:
COMMENT ON TABLE cereus_emotional_profiles IS
'Emotional Questionnaire Template:
1. Color World (select 3-5): Which colors make you feel most powerful?
   Options: Noir, Ivory, Burgundy, Navy, Emerald, Blush, Gold, Silver, Crimson, White
2. Texture Realm (select 2-3): Which textures call to you?
   Options: Silk, Velvet, Cashmere, Leather, Lace, Organza, Tweed, Denim, Satin, Wool
3. Fashion Icons (free text): Name 2-3 style icons you admire
4. Occasion Priority (rank): Rank these by importance
   Options: Gala/Red Carpet, Business/Corporate, Cocktail/Evening, Casual Elevated, Bridal/Special, Travel
5. Style Spectrum (slider 1-10):
   a. Comfort vs Impact: [comfortable --- head-turning]
   b. Minimalism vs Maximalism: [less is more --- more is more]
   c. Classic vs Avant-garde: [timeless --- cutting edge]
   d. Structured vs Flowing: [architectural --- ethereal]
6. Emotional Dressing (select 1): I dress to feel...
   Options: Empowered, Elegant, Mysterious, Joyful, Confident, Sensual, Free, Protected
7. Personal Manifesto (free text): Complete: "When I get dressed, I want the world to see..."';
