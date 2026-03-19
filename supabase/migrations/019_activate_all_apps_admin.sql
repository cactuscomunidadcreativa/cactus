-- ============================================================
-- Activate all app subscriptions for super_admin (eduardo@cactuscomunidadcreativa.com)
-- This ensures the admin can test all apps from the dashboard
-- ============================================================

-- Insert active subscriptions for all apps (skip if already exists via UNIQUE constraint)
INSERT INTO public.subscriptions (user_id, app_id, status, current_period_start, current_period_end)
SELECT
  u.id,
  a.id,
  'active',
  now(),
  now() + interval '1 year'
FROM auth.users u
CROSS JOIN public.apps a
WHERE u.email = 'eduardo@cactuscomunidadcreativa.com'
  AND a.id IN ('weekflow', 'ramona', 'tuna', 'agave', 'saguaro', 'pita', 'cereus')
ON CONFLICT (user_id, app_id)
DO UPDATE SET
  status = 'active',
  current_period_end = now() + interval '1 year',
  updated_at = now();

-- Also create a CEREUS maison (app_client) for testing if none exists
INSERT INTO public.app_clients (app_id, nombre, config, activo)
SELECT
  'cereus',
  'Privat',
  jsonb_build_object(
    'maison_name', 'Privat',
    'maison_tagline', 'Haute Couture Intelligence',
    'default_currency', 'PEN',
    'default_language', 'es',
    'margin_config', jsonb_build_object('min', 0.30, 'target', 0.45, 'premium', 0.60),
    'ar_enabled', false,
    'ai_photo_enabled', true,
    'production_tracking', true,
    'branding', jsonb_build_object(
      'primary_color', '#0A0A0A',
      'accent_color', '#C9A84C',
      'background_color', '#FFFFFF',
      'meta_title', 'Privat Atelier'
    )
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.app_clients WHERE app_id = 'cereus' AND nombre = 'Privat'
);

-- Assign super_admin to the Privat maison as admin
INSERT INTO public.app_client_users (client_id, user_id, rol, activo)
SELECT
  ac.id,
  u.id,
  'admin',
  true
FROM public.app_clients ac
CROSS JOIN auth.users u
WHERE ac.app_id = 'cereus'
  AND ac.nombre = 'Privat'
  AND u.email = 'eduardo@cactuscomunidadcreativa.com'
ON CONFLICT DO NOTHING;
