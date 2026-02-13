import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { generateContent } from '@/lib/ai';
import { STYLE_PROFILE_SYSTEM, STYLE_PROFILE_USER } from '@/modules/cereus/lib/ai-prompts';

// POST /api/cereus/ai/generate-profile — Generate AI style narrative
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { profileId } = body;

  if (!profileId) {
    return NextResponse.json({ error: 'profileId required' }, { status: 400 });
  }

  // Fetch the emotional profile
  const { data: profile, error: fetchError } = await db
    .from('cereus_emotional_profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  try {
    // Generate style narrative using AI
    const result = await generateContent({
      prompt: STYLE_PROFILE_USER(
        profile.style_archetypes || [],
        profile.questionnaire_responses || {},
        'es'
      ),
      systemPrompt: STYLE_PROFILE_SYSTEM,
      maxTokens: 500,
      temperature: 0.8,
    });

    // Update profile with AI-generated summary
    const { error: updateError } = await db
      .from('cereus_emotional_profiles')
      .update({
        style_summary: result.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      style_summary: result.content,
      provider: result.provider,
      model: result.model,
      success: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
