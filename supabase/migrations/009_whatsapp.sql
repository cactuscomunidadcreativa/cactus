-- ============================================
-- CACTUS PLATFORM - WhatsApp Central
-- ============================================

CREATE TABLE public.wa_phone_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  verified BOOLEAN DEFAULT false,
  verification_code TEXT,
  linked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.wa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  active_module TEXT DEFAULT 'router' CHECK (active_module IN ('router', 'weekflow', 'ramona')),
  context JSONB DEFAULT '{}',
  last_activity TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.wa_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  module TEXT,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_wa_phone_links_user ON public.wa_phone_links(user_id);
CREATE INDEX idx_wa_phone_links_phone ON public.wa_phone_links(phone);
CREATE INDEX idx_wa_sessions_phone ON public.wa_sessions(phone);
CREATE INDEX idx_wa_messages_phone ON public.wa_messages(phone);
CREATE INDEX idx_wa_messages_created ON public.wa_messages(created_at DESC);

-- RLS
ALTER TABLE public.wa_phone_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own phone link"
  ON public.wa_phone_links FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins read all phone links"
  ON public.wa_phone_links FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Service role manages sessions"
  ON public.wa_sessions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Users read own messages"
  ON public.wa_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins read all messages"
  ON public.wa_messages FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Service role manages messages"
  ON public.wa_messages FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
