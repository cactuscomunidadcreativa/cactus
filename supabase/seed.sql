-- ============================================
-- CACTUS PLATFORM - Seed Data
-- ============================================

-- Apps
INSERT INTO public.apps (id, name, description, icon, color, category, base_price_monthly, base_price_yearly, has_free_trial, trial_days, status, features, sort_order) VALUES
  ('weekflow', 'WeekFlow', 'Team check-ins & weekly meetings', '🌊', '#6366F1', 'productivity', 900, 9000, true, 30, 'live', '["Team check-ins", "Weekly tasks board", "Mood tracking with Plutchik wheel", "Team pulse analytics", "Presenter mode", "Multi-language (ES/EN)"]', 1),
  ('ramona', 'Ramona Social', 'Tu departamento de marketing con IA', '🌵', '#9A4E9A', 'marketing', 5900, 59000, true, 14, 'beta', '["AI content generation", "Market intelligence", "Content calendar", "Multi-platform publishing", "Voice profile", "Lead conversion"]', 2),
  ('legal-ai', 'Legal AI', 'Asistente legal inteligente para contratos y documentos', '⚖️', '#DC2626', 'legal', 7900, 79000, true, 7, 'coming-soon', '["Contract analysis", "Document generation", "Legal compliance checks", "Template library", "Multi-jurisdiction support"]', 3),
  ('analytics-pro', 'Analytics Pro', 'Análisis avanzado y reportes para tu negocio', '📊', '#0EA5E9', 'analytics', 4900, 49000, true, 14, 'coming-soon', '["Custom dashboards", "Automated reports", "Data visualization", "KPI tracking", "Export to PDF/Excel", "Team sharing"]', 4);

-- WeekFlow: single tier
INSERT INTO public.app_tiers (app_id, name, display_name, price_monthly, price_yearly, is_default, features, limits, sort_order) VALUES
  ('weekflow', 'standard', 'Standard', 900, 9000, true, '["Unlimited teams", "Mood tracking with Plutchik wheel", "Team pulse analytics", "Presenter mode", "Up to 50 members per team", "Multi-language (ES/EN)"]', '{"teams": -1, "members_per_team": 50}', 1);

-- Ramona Social: four tiers
INSERT INTO public.app_tiers (app_id, name, display_name, price_monthly, price_yearly, features, limits, sort_order) VALUES
  ('ramona', 'starter', 'Starter', 5900, 59000, '["100 contenidos/mes", "Studio básico (texto + imágenes)", "Promoción orgánica básica", "1 marca"]', '{"contents_per_month": 100, "video_minutes": 0, "brands": 1}', 1),
  ('ramona', 'creator', 'Creator', 14900, 149000, '["300 contenidos/mes", "Studio completo (+15 min video)", "Promoción orgánica completa", "WhatsApp básico", "1 marca"]', '{"contents_per_month": 300, "video_minutes": 15, "brands": 1}', 2),
  ('ramona', 'business', 'Business', 34900, 349000, '["600 contenidos/mes", "Studio pro (+60 min video)", "Ads integrados", "WhatsApp + CRM", "3 marcas"]', '{"contents_per_month": 600, "video_minutes": 60, "brands": 3}', 3),
  ('ramona', 'agency', 'Agency', 69900, 699000, '["Contenidos ilimitados", "120 min video", "Multi-marca", "API acceso", "White-label", "10 marcas"]', '{"contents_per_month": -1, "video_minutes": 120, "brands": 10}', 4);

-- ============================================
-- Super Admin Setup
-- ============================================
-- After eduardo@cactuscomunidadcreativa.com signs up, run this to grant super_admin:
-- UPDATE public.profiles SET role = 'super_admin' WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'eduardo@cactuscomunidadcreativa.com'
-- );

-- Auto-promote via trigger: if the email matches, set role to super_admin
CREATE OR REPLACE FUNCTION public.auto_promote_super_admin()
RETURNS trigger AS $$
BEGIN
  IF NEW.id IN (
    SELECT id FROM auth.users WHERE email = 'eduardo@cactuscomunidadcreativa.com'
  ) THEN
    NEW.role = 'super_admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER promote_super_admin
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_promote_super_admin();
