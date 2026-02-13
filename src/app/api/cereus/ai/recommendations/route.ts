import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { generateContent } from '@/lib/ai';
import { ADVISOR_SYSTEM, ADVISOR_RECOMMENDATION } from '@/modules/cereus/lib/ai-prompts';

// POST /api/cereus/ai/recommendations — Generate AI style recommendations
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { clientId, maisonId, occasion, season, budgetRange, language } = body;

  if (!clientId || !maisonId || !occasion || !season) {
    return NextResponse.json({ error: 'clientId, maisonId, occasion, and season required' }, { status: 400 });
  }

  // Fetch all needed data in parallel
  const [clientRes, profileRes, paletteRes, garmentsRes, closetRes] = await Promise.all([
    db.from('cereus_clients').select('*').eq('id', clientId).single(),
    db.from('cereus_emotional_profiles').select('*').eq('client_id', clientId).eq('is_current', true).single(),
    db.from('cereus_color_palettes').select('*').eq('client_id', clientId).eq('activo', true).limit(1).single(),
    db.from('cereus_garments').select('id, name, category, base_price, status').eq('maison_id', maisonId).in('status', ['approved', 'costing', 'in_production']).limit(30),
    db.from('cereus_closet_items').select('garment_name, category, primary_color').eq('client_id', clientId).eq('activo', true).limit(20),
  ]);

  const client = clientRes.data;
  const profile = profileRes.data;

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  if (!profile) return NextResponse.json({ error: 'Client has no emotional profile. Complete the questionnaire first.' }, { status: 400 });

  const paletteColors = paletteRes.data?.colors?.map((c: { hex: string }) => c.hex) || [];
  const garments = (garmentsRes.data || []).map((g: { id: string; name: string; category: string; base_price: number | null }) => ({
    id: g.id,
    name: g.name,
    category: g.category,
    price: g.base_price || 0,
  }));
  const closetSummary = (closetRes.data || []).map((i: { garment_name: string; category: string; primary_color: string | null }) =>
    `${i.garment_name} (${i.category}, ${i.primary_color || 'N/A'})`
  );

  try {
    const context = {
      client_name: client.full_name,
      archetypes: profile.style_archetypes || [],
      color_palette: paletteColors,
      occasion,
      season,
      budget_range: budgetRange,
      available_garments: garments,
      closet_summary: closetSummary,
      language: language || 'es',
    };

    const result = await generateContent({
      prompt: ADVISOR_RECOMMENDATION(context),
      systemPrompt: ADVISOR_SYSTEM,
      maxTokens: 1500,
      temperature: 0.7,
    });

    // Parse JSON from AI response
    let parsed = { recommended_garments: [], recommended_outfits: [], reasoning: '' };
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
      parsed.reasoning = result.content;
    }

    // Save recommendation to DB
    const { data: recommendation, error: saveError } = await db
      .from('cereus_recommendations')
      .insert({
        client_id: clientId,
        advisor_id: user.id,
        occasion,
        season,
        budget_range: budgetRange || null,
        recommended_garments: parsed.recommended_garments,
        recommended_outfits: parsed.recommended_outfits,
        ai_generated: true,
        ai_reasoning: parsed.reasoning,
        status: 'draft',
      })
      .select()
      .single();

    if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 });

    return NextResponse.json({
      recommendation,
      parsed,
      provider: result.provider,
      success: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
