-- ============================================
-- RAMONA SOCIAL - Conversational Chat
-- ============================================

CREATE TABLE public.rm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.rm_brands(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  context JSONB DEFAULT '{}',
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.rm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.rm_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  generation_id UUID REFERENCES public.rm_generations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_rm_conversations_user ON public.rm_conversations(user_id);
CREATE INDEX idx_rm_conversations_brand ON public.rm_conversations(brand_id);
CREATE INDEX idx_rm_conversations_updated ON public.rm_conversations(updated_at DESC);
CREATE INDEX idx_rm_messages_conversation ON public.rm_messages(conversation_id);
CREATE INDEX idx_rm_messages_created ON public.rm_messages(created_at);

-- RLS
ALTER TABLE public.rm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rm_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations"
  ON public.rm_conversations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage messages in own conversations"
  ON public.rm_messages FOR ALL
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.rm_conversations WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.rm_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages conversations"
  ON public.rm_conversations FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages messages"
  ON public.rm_messages FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
