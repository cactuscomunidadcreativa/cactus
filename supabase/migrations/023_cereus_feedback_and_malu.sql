-- ============================================================
-- 023: Design Feedback System + Malu Privat Access
-- ============================================================

-- ─── 1. Design Feedback Table ───────────────────────────────

CREATE TABLE IF NOT EXISTS cereus_design_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maison_id UUID NOT NULL REFERENCES app_clients(id) ON DELETE CASCADE,

  -- Polymorphic target
  entity_type TEXT NOT NULL CHECK (entity_type IN ('garment', 'variant', 'order')),
  entity_id UUID NOT NULL,

  -- Threading
  parent_id UUID REFERENCES cereus_design_feedback(id) ON DELETE CASCADE,

  -- Author
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('designer', 'client', 'advisor', 'workshop')),

  -- Content
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',

  -- Feedback type & approval workflow
  feedback_type TEXT NOT NULL DEFAULT 'comment' CHECK (feedback_type IN ('comment', 'approval', 'revision_request', 'revision_response')),

  -- Revision tracking
  revision_round INTEGER DEFAULT 1,

  -- Resolution
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_design_feedback_entity ON cereus_design_feedback(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_design_feedback_parent ON cereus_design_feedback(parent_id);
CREATE INDEX IF NOT EXISTS idx_design_feedback_maison ON cereus_design_feedback(maison_id);

-- Revision count on variants
ALTER TABLE cereus_variants ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0;

-- ─── 2. Malu Privat Access ─────────────────────────────────

-- Give malu@privat.pe a subscription to cereus
INSERT INTO public.subscriptions (user_id, app_id, status, current_period_start, current_period_end)
SELECT
  u.id,
  'cereus',
  'active',
  now(),
  now() + interval '1 year'
FROM auth.users u
WHERE u.email = 'malu@privat.pe'
ON CONFLICT (user_id, app_id)
DO UPDATE SET
  status = 'active',
  current_period_end = now() + interval '1 year',
  updated_at = now();

-- Assign Malu to the Privat maison as user
INSERT INTO public.app_client_users (client_id, user_id, rol, email, nombre_contacto, activo)
SELECT
  ac.id,
  u.id,
  'user',
  'malu@privat.pe',
  'Malu Privat',
  true
FROM public.app_clients ac
CROSS JOIN auth.users u
WHERE ac.app_id = 'cereus'
  AND ac.nombre = 'Privat'
  AND u.email = 'malu@privat.pe'
ON CONFLICT (client_id, user_id) DO NOTHING;

-- Also create Malu as a cereus_client (VIP) for the portal
INSERT INTO public.cereus_clients (maison_id, full_name, email, role, vip_tier, status)
SELECT
  ac.id,
  'Malu Privat',
  'malu@privat.pe',
  'vip',
  'PRIVAT',
  'active'
FROM public.app_clients ac
WHERE ac.app_id = 'cereus'
  AND ac.nombre = 'Privat'
  AND NOT EXISTS (
    SELECT 1 FROM cereus_clients WHERE email = 'malu@privat.pe'
  );

-- Give Malu subscriptions to all apps for full testing
INSERT INTO public.subscriptions (user_id, app_id, status, current_period_start, current_period_end)
SELECT
  u.id,
  a.id,
  'active',
  now(),
  now() + interval '1 year'
FROM auth.users u
CROSS JOIN public.apps a
WHERE u.email = 'malu@privat.pe'
  AND a.id IN ('weekflow', 'ramona', 'tuna', 'agave', 'saguaro', 'pita', 'cereus')
ON CONFLICT (user_id, app_id)
DO UPDATE SET
  status = 'active',
  current_period_end = now() + interval '1 year',
  updated_at = now();
