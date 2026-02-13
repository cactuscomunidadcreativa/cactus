import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  calculateArchetypeScores,
  getTopArchetypes,
  determineEmotionalSeason,
  determineWarmth,
} from '@/modules/cereus/lib/emotional-questionnaire';

// GET /api/cereus/emotional-profiles?clientId=xxx&history=true
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  const history = searchParams.get('history') === 'true';

  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });

  let query = db
    .from('cereus_emotional_profiles')
    .select('*')
    .eq('client_id', clientId)
    .order('version', { ascending: false });

  if (!history) {
    query = query.eq('is_current', true).limit(1);
  }

  const { data: profiles, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also fetch color palette for the client
  const { data: palettes } = await db
    .from('cereus_color_palettes')
    .select('*')
    .eq('client_id', clientId)
    .eq('activo', true)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!history) {
    return NextResponse.json({
      profile: profiles?.[0] || null,
      palette: palettes?.[0] || null,
    });
  }

  return NextResponse.json({
    profiles: profiles || [],
    palette: palettes?.[0] || null,
  });
}

// POST /api/cereus/emotional-profiles — Save questionnaire + calculate archetypes
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { clientId, responses } = body;

  if (!clientId || !responses) {
    return NextResponse.json({ error: 'clientId and responses required' }, { status: 400 });
  }

  // Calculate archetype scores from responses
  const scores = calculateArchetypeScores(responses);
  const topArchetypes = getTopArchetypes(scores, 3);
  const emotionalSeason = determineEmotionalSeason(responses);
  const warmth = determineWarmth(emotionalSeason);

  // Get current max version for this client
  const { data: existing } = await db
    .from('cereus_emotional_profiles')
    .select('version')
    .eq('client_id', clientId)
    .order('version', { ascending: false })
    .limit(1);

  const nextVersion = (existing?.[0]?.version || 0) + 1;

  // Mark previous profiles as not current
  await db
    .from('cereus_emotional_profiles')
    .update({ is_current: false })
    .eq('client_id', clientId)
    .eq('is_current', true);

  // Extract mood tags from responses
  const moodTags: string[] = [];
  if (responses.mood_dressing) moodTags.push(responses.mood_dressing);

  // Insert new emotional profile
  const { data: profile, error } = await db
    .from('cereus_emotional_profiles')
    .insert({
      client_id: clientId,
      questionnaire_responses: responses,
      style_archetypes: topArchetypes,
      primary_archetype: topArchetypes[0],
      archetype_scores: scores,
      emotional_season: emotionalSeason,
      mood_tags: moodTags,
      is_current: true,
      version: nextVersion,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-create color palette based on selected colors + warmth
  const colorMap: Record<string, { hex: string; name: string }> = {
    noir: { hex: '#1A1A1A', name: 'Noir' },
    ivory: { hex: '#FFFFF0', name: 'Ivory' },
    burgundy: { hex: '#800020', name: 'Burgundy' },
    navy: { hex: '#000080', name: 'Navy' },
    emerald: { hex: '#046307', name: 'Emerald' },
    blush: { hex: '#DE5D83', name: 'Blush' },
    gold: { hex: '#B8943A', name: 'Gold' },
    silver: { hex: '#C0C0C0', name: 'Silver' },
    crimson: { hex: '#DC143C', name: 'Crimson' },
    white: { hex: '#FFFFFF', name: 'White' },
    earth_tones: { hex: '#8B7355', name: 'Earth Tones' },
    jewel_tones: { hex: '#6A0DAD', name: 'Jewel Tones' },
  };

  const selectedColors = (responses.color_preferences as string[]) || [];
  const paletteColors = selectedColors.map((c: string, i: number) => ({
    hex: colorMap[c]?.hex || '#888888',
    name: colorMap[c]?.name || c,
    role: i === 0 ? 'primary' : i === 1 ? 'accent' : i === 2 ? 'statement' : 'complement',
  }));

  if (paletteColors.length > 0) {
    // Deactivate old palettes
    await db
      .from('cereus_color_palettes')
      .update({ activo: false })
      .eq('client_id', clientId)
      .eq('source', 'questionnaire');

    await db.from('cereus_color_palettes').insert({
      client_id: clientId,
      name: `${topArchetypes[0]} Palette v${nextVersion}`,
      description: `Auto-generated from emotional questionnaire`,
      colors: paletteColors,
      warmth,
      season: emotionalSeason,
      is_seasonal: false,
      is_system: false,
      source: 'questionnaire',
      activo: true,
    });
  }

  return NextResponse.json({ profile, success: true });
}
