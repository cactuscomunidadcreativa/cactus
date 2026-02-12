import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateChat } from '@/lib/ai';
import type { AIChatMessage } from '@/lib/ai';
import { getAIConfig } from '@/lib/ai/config';
import { getMonthKey } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { conversationId, brandId, message } = body;

  if (!conversationId || !brandId || !message) {
    return NextResponse.json({ error: 'conversationId, brandId, and message are required' }, { status: 400 });
  }

  if (typeof message === 'string' && message.length > 10000) {
    return NextResponse.json({ error: 'message exceeds maximum length (10000 chars)' }, { status: 400 });
  }

  // Verify brand ownership
  const { data: brand } = await supabase
    .from('rm_brands')
    .select('*')
    .eq('id', brandId)
    .eq('user_id', user.id)
    .single();

  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  // Check token budget
  const month = getMonthKey();
  const aiConfig = await getAIConfig();

  const { data: budget } = await supabase
    .from('token_budgets')
    .select('*')
    .eq('user_id', user.id)
    .eq('app_id', 'ramona')
    .eq('month', month)
    .single();

  const genLimit = budget?.monthly_generation_limit ?? aiConfig.globalMonthlyGenerationLimit;
  const genUsed = budget?.monthly_generations_used ?? 0;
  if (genLimit !== -1 && genUsed >= genLimit) {
    return NextResponse.json(
      { error: 'Monthly generation limit reached.' },
      { status: 429 }
    );
  }

  // Load conversation messages for context
  const { data: prevMessages } = await supabase
    .from('rm_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20);

  const chatMessages: AIChatMessage[] = (prevMessages || []).map((m: any) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  // Add current message
  chatMessages.push({ role: 'user', content: message });

  // Build system prompt from brand profile
  const { buildRamonaSystemPrompt } = await import('@/modules/ramona/lib/ramona-personality');
  const systemPrompt = buildRamonaSystemPrompt(brand);

  // Log generation start
  const { data: generation } = await supabase
    .from('rm_generations')
    .insert({
      brand_id: brandId,
      user_id: user.id,
      prompt: message,
      system_prompt: systemPrompt.slice(0, 500),
      model: '',
      provider: 'claude',
      input_tokens: 0,
      output_tokens: 0,
      status: 'processing',
    })
    .select('id')
    .single();

  try {
    const result = await generateChat({
      messages: chatMessages,
      systemPrompt,
      maxTokens: 2048,
      temperature: 0.7,
    });

    // Save assistant message
    await supabase.from('rm_messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: result.content,
      metadata: { provider: result.provider, model: result.model },
      generation_id: generation?.id,
    });

    // Update conversation
    await supabase
      .from('rm_conversations')
      .update({
        message_count: (prevMessages?.length || 0) + 2,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    // Update generation log
    if (generation) {
      await supabase
        .from('rm_generations')
        .update({
          model: result.model,
          provider: result.provider,
          input_tokens: result.inputTokens,
          output_tokens: result.outputTokens,
          response: result.content,
          status: 'completed',
          duration_ms: result.durationMs,
        })
        .eq('id', generation.id);
    }

    // Update token budget
    const totalTokens = result.inputTokens + result.outputTokens;
    if (budget) {
      await supabase
        .from('token_budgets')
        .update({
          monthly_tokens_used: (budget.monthly_tokens_used || 0) + totalTokens,
          monthly_generations_used: (budget.monthly_generations_used || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', budget.id);
    } else {
      await supabase.from('token_budgets').upsert({
        user_id: user.id,
        app_id: 'ramona',
        month,
        monthly_tokens_used: totalTokens,
        monthly_generations_used: 1,
      }, { onConflict: 'user_id,app_id,month' });
    }

    return NextResponse.json({
      content: result.content,
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    if (generation) {
      await supabase
        .from('rm_generations')
        .update({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', generation.id);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chat failed' },
      { status: 500 }
    );
  }
}
