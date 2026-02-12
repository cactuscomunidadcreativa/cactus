import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateChat } from '@/lib/ai';
import { buildPitaSystemPrompt, buildPitaRefinePrompt, buildPitaGeneratePrompt } from '@/modules/pita/lib/ai-prompts';
import type { AIChatMessage } from '@/lib/ai';

// POST /api/pita/ai/generate — AI content generation for PITA presentations
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { presentationId, messages, currentContent, sectionType, mode } = body;

  if (!presentationId) {
    return NextResponse.json({ error: 'presentationId is required' }, { status: 400 });
  }

  // Verify presentation ownership
  const { data: presentation } = await supabase
    .from('pita_presentations')
    .select('id, title, brand_config')
    .eq('id', presentationId)
    .eq('created_by', user.id)
    .single();

  if (!presentation) {
    return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
  }

  const brandConfig = presentation.brand_config || {
    primaryColor: '#0E1B2C',
    secondaryColor: '#4FAF8F',
    accentColor: '#C7A54A',
    backgroundColor: '#FFFFFF',
    textColor: '#0E1B2C',
  };

  // Build system prompt
  const systemPrompt = buildPitaSystemPrompt({
    presentationTitle: presentation.title,
    brandConfig,
    currentSectionType: sectionType,
    currentContent: mode === 'refine' ? currentContent : undefined,
  });

  // Build messages array
  let chatMessages: AIChatMessage[] = [];

  if (mode === 'refine' && currentContent && messages?.length > 0) {
    // Refine mode: prepend the refine context
    const lastMessage = messages[messages.length - 1];
    const refinePrompt = buildPitaRefinePrompt(currentContent, lastMessage.content);
    chatMessages = [{ role: 'user' as const, content: refinePrompt }];
  } else if (mode === 'generate' && messages?.length > 0) {
    // Generate mode: use the generate prompt helper
    const lastMessage = messages[messages.length - 1];
    const generatePrompt = buildPitaGeneratePrompt(lastMessage.content, sectionType || 'content');
    chatMessages = [{ role: 'user' as const, content: generatePrompt }];
  } else if (messages?.length > 0) {
    // Chat mode: pass all messages
    chatMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
  } else {
    return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
  }

  try {
    const response = await generateChat({
      messages: chatMessages,
      systemPrompt,
      maxTokens: 4096,
      temperature: 0.7,
    });

    return NextResponse.json({
      content: response.content,
      provider: response.provider,
      model: response.model,
      ok: true,
    });
  } catch (error: any) {
    console.error('PITA AI generation error:', error);
    return NextResponse.json(
      { error: error.message || 'AI generation failed' },
      { status: 500 }
    );
  }
}
