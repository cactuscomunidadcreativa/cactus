-- ============================================================
-- CEREUS Storefront — Products, Pages, Chatbot Knowledge
-- Full CMS for white-label maison storefronts
-- ============================================================

-- ─── PRODUCT CATEGORIES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS cereus_store_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maison_id UUID NOT NULL REFERENCES app_clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES cereus_store_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(maison_id, slug)
);

CREATE INDEX idx_store_categories_maison ON cereus_store_categories(maison_id);

-- ─── PRODUCTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cereus_store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maison_id UUID NOT NULL REFERENCES app_clients(id) ON DELETE CASCADE,
  category_id UUID REFERENCES cereus_store_categories(id) ON DELETE SET NULL,
  collection_id UUID REFERENCES cereus_collections(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  short_description TEXT,

  price NUMERIC(10,2) NOT NULL,
  compare_at_price NUMERIC(10,2),  -- original price for sale items
  currency TEXT DEFAULT 'PEN',
  sku TEXT,

  images JSONB DEFAULT '[]',       -- array of { url, alt, sort_order }
  variants JSONB DEFAULT '[]',     -- array of { name, value, price_modifier, sku }
  sizes JSONB DEFAULT '[]',        -- array of available sizes
  colors JSONB DEFAULT '[]',       -- array of { name, hex, image_url }

  badge TEXT,                      -- 'New', 'Sale', 'Best Seller', etc.
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  stock INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,

  seo_title TEXT,
  seo_description TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(maison_id, slug)
);

CREATE INDEX idx_store_products_maison ON cereus_store_products(maison_id);
CREATE INDEX idx_store_products_category ON cereus_store_products(category_id);
CREATE INDEX idx_store_products_collection ON cereus_store_products(collection_id);
CREATE INDEX idx_store_products_active ON cereus_store_products(maison_id, is_active);

-- ─── STOREFRONT PAGES / SECTIONS ────────────────────────────
CREATE TABLE IF NOT EXISTS cereus_store_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maison_id UUID NOT NULL REFERENCES app_clients(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,              -- 'home', 'about', 'contact', etc.
  title TEXT NOT NULL,
  is_published BOOLEAN DEFAULT true,
  sections JSONB DEFAULT '[]',    -- ordered array of section configs
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(maison_id, slug)
);

CREATE INDEX idx_store_pages_maison ON cereus_store_pages(maison_id);

-- ─── CHATBOT KNOWLEDGE BASE ────────────────────────────────
CREATE TABLE IF NOT EXISTS cereus_chatbot_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maison_id UUID NOT NULL REFERENCES app_clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,           -- the actual knowledge text
  category TEXT DEFAULT 'general', -- 'products', 'shipping', 'returns', 'faq', 'brand', 'general'
  source TEXT,                     -- 'manual', 'url', 'file'
  source_url TEXT,
  is_active BOOLEAN DEFAULT true,
  tokens_estimate INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chatbot_knowledge_maison ON cereus_chatbot_knowledge(maison_id);
CREATE INDEX idx_chatbot_knowledge_category ON cereus_chatbot_knowledge(maison_id, category);

-- ─── CHATBOT CONVERSATIONS (for analytics) ──────────────────
CREATE TABLE IF NOT EXISTS cereus_chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maison_id UUID NOT NULL REFERENCES app_clients(id) ON DELETE CASCADE,
  visitor_id TEXT,                 -- anonymous visitor identifier
  messages JSONB DEFAULT '[]',    -- array of { role, content, timestamp }
  resolved BOOLEAN DEFAULT false,
  rating INTEGER,                 -- 1-5 satisfaction rating
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chatbot_conversations_maison ON cereus_chatbot_conversations(maison_id);

-- ─── RLS POLICIES ───────────────────────────────────────────
ALTER TABLE cereus_store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_store_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_chatbot_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE cereus_chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Maison members can read store data
CREATE POLICY "Maison users read categories" ON cereus_store_categories
  FOR SELECT TO authenticated USING (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Maison users manage categories" ON cereus_store_categories
  FOR ALL TO authenticated USING (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Maison users read products" ON cereus_store_products
  FOR SELECT TO authenticated USING (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Maison users manage products" ON cereus_store_products
  FOR ALL TO authenticated USING (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Maison users manage pages" ON cereus_store_pages
  FOR ALL TO authenticated USING (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Maison users manage knowledge" ON cereus_chatbot_knowledge
  FOR ALL TO authenticated USING (user_belongs_to_cereus_maison(maison_id));

CREATE POLICY "Maison users read conversations" ON cereus_chatbot_conversations
  FOR ALL TO authenticated USING (user_belongs_to_cereus_maison(maison_id));

-- Public read for active products and pages (storefront visitors)
CREATE POLICY "Public read active products" ON cereus_store_products
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Public read active categories" ON cereus_store_categories
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Public read published pages" ON cereus_store_pages
  FOR SELECT TO anon USING (is_published = true);
