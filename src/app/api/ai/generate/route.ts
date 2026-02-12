import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateContent } from '@/lib/ai';
import type { AIProvider } from '@/lib/ai';
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

  const { prompt, systemPrompt, brandId, platform, contentType, provider } = body;

  if (!prompt || !brandId) {
    return NextResponse.json({ error: 'prompt and brandId are required' }, { status: 400 });
  }

  if (typeof prompt === 'string' && prompt.length > 10000) {
    return NextResponse.json({ error: 'prompt exceeds maximum length (10000 chars)' }, { status: 400 });
  }

  // Verify brand ownership
  const { data: brand } = await supabase
    .from('rm_brands')
    .select('id')
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

  // Check generation limit (user-specific budget or global)
  const genLimit = budget?.monthly_generation_limit ?? aiConfig.globalMonthlyGenerationLimit;
  const genUsed = budget?.monthly_generations_used ?? 0;

  if (genLimit !== -1 && genUsed >= genLimit) {
    return NextResponse.json(
      { error: 'Monthly generation limit reached. Contact your administrator.' },
      { status: 429 }
    );
  }

  // Check token limit
  const tokenLimit = budget?.monthly_token_limit ?? aiConfig.globalMonthlyTokenLimit;
  const tokensUsed = budget?.monthly_tokens_used ?? 0;

  if (tokenLimit !== -1 && tokensUsed >= tokenLimit) {
    return NextResponse.json(
      { error: 'Monthly token limit reached. Contact your administrator.' },
      { status: 429 }
    );
  }

  // Log generation start
  const { data: generation } = await supabase
    .from('rm_generations')
    .insert({
      brand_id: brandId,
      user_id: user.id,
      prompt,
      system_prompt: systemPrompt || null,
      model: '',
      provider: provider || 'claude',
      input_tokens: 0,
      output_tokens: 0,
      status: 'processing',
    })
    .select('id')
    .single();

  try {
    const result = await generateContent({
      prompt,
      systemPrompt,
      provider: provider as AIProvider | undefined,
      maxTokens: 1024,
      temperature: 0.7,
    });

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

    // Update usage counter
    const { data: existing } = await supabase
      .from('rm_usage')
      .select('id, generation_count')
      .eq('user_id', user.id)
      .eq('brand_id', brandId)
      .eq('month', month)
      .single();

    if (existing) {
      await supabase
        .from('rm_usage')
        .update({ generation_count: existing.generation_count + 1 })
        .eq('id', existing.id);
    } else {
      await supabase.from('rm_usage').insert({
        user_id: user.id,
        brand_id: brandId,
        month,
        content_count: 0,
        generation_count: 1,
      });
    }

    return NextResponse.json({
      content: result.content,
      provider: result.provider,
      model: result.model,
      generationId: generation?.id,
    });
  } catch (error) {
    // Update generation as failed
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
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
