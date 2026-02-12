-- CMS System for Cactus Comunidad CreatIVA
-- This migration creates tables for managing website content

-- ============================================
-- CMS Content Table (General content blocks)
-- ============================================
CREATE TABLE IF NOT EXISTS cms_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL,  -- 'hero', 'about', 'values', 'cta', etc.
  locale TEXT DEFAULT 'es',  -- 'es', 'en', 'pt', etc.
  content JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(section, locale)
);

-- ============================================
-- Success Cases / Testimonials
-- ============================================
CREATE TABLE IF NOT EXISTS cms_success_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT,
  industry TEXT,
  description TEXT,
  metrics JSONB DEFAULT '[]',  -- [{"label": "Reducción tiempo", "value": "40%"}, ...]
  quote TEXT,
  author_name TEXT,
  author_role TEXT,
  author_image TEXT,
  app_id TEXT,  -- 'ramona', 'tuna', 'agave', 'saguaro'
  featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  locale TEXT DEFAULT 'es',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Blog Posts
-- ============================================
CREATE TABLE IF NOT EXISTS cms_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,  -- Markdown content
  cover_image TEXT,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  category TEXT,  -- 'noticias', 'tutoriales', 'casos', 'comunidad'
  tags TEXT[] DEFAULT '{}',
  app_id TEXT,  -- Related app if applicable
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  locale TEXT DEFAULT 'es',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Contact Form Submissions
-- ============================================
CREATE TABLE IF NOT EXISTS cms_contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  app_interest TEXT,  -- Which app they're interested in
  source TEXT DEFAULT 'website',  -- 'website', 'app', 'demo'
  status TEXT DEFAULT 'new',  -- 'new', 'read', 'replied', 'archived'
  notes TEXT,  -- Admin notes
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- App Landing Pages Content
-- ============================================
CREATE TABLE IF NOT EXISTS cms_app_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL,  -- 'ramona', 'tuna', 'agave', 'saguaro'
  locale TEXT DEFAULT 'es',

  -- Hero section
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_description TEXT,
  hero_cta_text TEXT,
  hero_cta_link TEXT,
  hero_image TEXT,

  -- Features section
  features JSONB DEFAULT '[]',  -- [{"icon": "...", "title": "...", "description": "..."}]

  -- Pricing section
  pricing JSONB DEFAULT '{}',  -- {"plans": [...], "currency": "USD"}

  -- FAQ section
  faqs JSONB DEFAULT '[]',  -- [{"question": "...", "answer": "..."}]

  -- Additional sections
  custom_sections JSONB DEFAULT '[]',

  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(app_id, locale)
);

-- ============================================
-- Newsletter Subscribers
-- ============================================
CREATE TABLE IF NOT EXISTS cms_newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  interests TEXT[] DEFAULT '{}',  -- ['ramona', 'tuna', 'updates', 'blog']
  source TEXT DEFAULT 'website',
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  unsubscribed BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Media Library
-- ============================================
CREATE TABLE IF NOT EXISTS cms_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_filename TEXT,
  mime_type TEXT,
  size INTEGER,
  url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  folder TEXT DEFAULT 'general',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_success_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_app_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_media ENABLE ROW LEVEL SECURITY;

-- Public read for published content
CREATE POLICY "Public can read active content" ON cms_content
  FOR SELECT USING (active = true);

CREATE POLICY "Public can read active success cases" ON cms_success_cases
  FOR SELECT USING (active = true);

CREATE POLICY "Public can read published posts" ON cms_blog_posts
  FOR SELECT USING (published = true);

CREATE POLICY "Public can read active app pages" ON cms_app_pages
  FOR SELECT USING (active = true);

CREATE POLICY "Public can read media" ON cms_media
  FOR SELECT USING (true);

-- Admin full access
CREATE POLICY "Admin manages content" ON cms_content
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Admin manages success cases" ON cms_success_cases
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Admin manages blog posts" ON cms_blog_posts
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Admin manages contact submissions" ON cms_contact_submissions
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Admin manages app pages" ON cms_app_pages
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Admin manages newsletter" ON cms_newsletter_subscribers
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Admin manages media" ON cms_media
  FOR ALL USING (public.is_super_admin());

-- Public can submit contact forms
CREATE POLICY "Public can submit contact" ON cms_contact_submissions
  FOR INSERT WITH CHECK (true);

-- Public can subscribe to newsletter
CREATE POLICY "Public can subscribe" ON cms_newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cms_content_section ON cms_content(section, locale);
CREATE INDEX IF NOT EXISTS idx_cms_blog_slug ON cms_blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_cms_blog_category ON cms_blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_cms_blog_published ON cms_blog_posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_contact_status ON cms_contact_submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_app_pages_app ON cms_app_pages(app_id, locale);

-- ============================================
-- Insert Default Content
-- ============================================
INSERT INTO cms_content (section, locale, content) VALUES
('hero', 'es', '{
  "title": "Cactus Comunidad CreatIVA",
  "tagline": "Inteligencia en Cada Espina. Comunidad en Cada Especie.",
  "subtitle": "Soluciones de IA diseñadas para potenciar tu creatividad, optimizar tus procesos y conectarte con una comunidad que crece junta.",
  "cta_primary": "Explorar Apps",
  "cta_secondary": "Conocer Más"
}'::jsonb),
('about', 'es', '{
  "title": "Quiénes Somos",
  "description": "En Cactus Comunidad CreatIVA creemos que la tecnología debe adaptarse a ti, no al revés. Como el cactus que florece en el desierto, nuestras soluciones están diseñadas para prosperar donde otros ven limitaciones.",
  "vision": "Ser la comunidad líder en soluciones de IA accesibles y humanizadas para creativos y emprendedores de habla hispana.",
  "mission": "Democratizar el acceso a herramientas de inteligencia artificial, creando soluciones que potencien la creatividad humana sin reemplazarla."
}'::jsonb),
('values', 'es', '{
  "items": [
    {"icon": "🌵", "title": "Resiliencia", "description": "Como el cactus, prosperamos en cualquier entorno"},
    {"icon": "💧", "title": "Eficiencia", "description": "Hacemos más con menos, optimizando cada recurso"},
    {"icon": "🎨", "title": "Creatividad", "description": "La IA potencia, nunca reemplaza, tu creatividad"},
    {"icon": "🤝", "title": "Comunidad", "description": "Crecemos juntos, compartiendo conocimiento"},
    {"icon": "💚", "title": "Integridad", "description": "Transparencia y honestidad en cada interacción"}
  ]
}'::jsonb)
ON CONFLICT (section, locale) DO NOTHING;

-- Insert default app pages
INSERT INTO cms_app_pages (app_id, locale, hero_title, hero_subtitle, hero_description, features) VALUES
('ramona', 'es', 'RAMONA', 'Tu Asistente de Arte con IA', 'Análisis de estilo artístico, sugerencias de composición, paletas de colores y feedback constructivo para tus obras.', '[
  {"icon": "🎨", "title": "Análisis de Estilo", "description": "Identifica elementos de tu estilo único"},
  {"icon": "🖼️", "title": "Composición", "description": "Sugerencias para mejorar tus composiciones"},
  {"icon": "🌈", "title": "Paletas de Color", "description": "Genera paletas armoniosas para tus obras"},
  {"icon": "💬", "title": "Feedback", "description": "Retroalimentación constructiva y personalizada"}
]'::jsonb),
('tuna', 'es', 'TUNA', 'Gestión Inteligente de Proyectos', 'Organiza tareas, colabora en equipo y mantén el ritmo de tus proyectos con asistencia de IA.', '[
  {"icon": "📋", "title": "Gestión de Tareas", "description": "Organiza y prioriza tu trabajo"},
  {"icon": "👥", "title": "Colaboración", "description": "Trabaja en equipo de forma fluida"},
  {"icon": "📊", "title": "Analytics", "description": "Métricas y reportes de productividad"},
  {"icon": "🤖", "title": "IA Asistente", "description": "Sugerencias inteligentes para optimizar"}
]'::jsonb),
('agave', 'es', 'AGAVE', 'Asistente de Precios Inteligente', 'Calcula márgenes, analiza costos y obtén recomendaciones de precios optimizados para tu negocio.', '[
  {"icon": "💰", "title": "Cálculo de Márgenes", "description": "Optimiza tu rentabilidad automáticamente"},
  {"icon": "📈", "title": "Análisis de Costos", "description": "Desglose detallado de costos"},
  {"icon": "🎯", "title": "Precios Óptimos", "description": "Recomendaciones basadas en datos"},
  {"icon": "📊", "title": "Reportes", "description": "Visualiza tu desempeño financiero"}
]'::jsonb),
('saguaro', 'es', 'SAGUARO', 'Bienestar y Productividad', 'Equilibra tu semana con check-ins de bienestar, seguimiento de hábitos y herramientas de enfoque.', '[
  {"icon": "🧘", "title": "Check-ins", "description": "Monitorea tu bienestar diario"},
  {"icon": "📅", "title": "Planificación", "description": "Organiza tu semana de forma balanceada"},
  {"icon": "🎯", "title": "Hábitos", "description": "Construye rutinas saludables"},
  {"icon": "⏱️", "title": "Pomodoro", "description": "Sesiones de enfoque productivo"}
]'::jsonb)
ON CONFLICT (app_id, locale) DO NOTHING;
