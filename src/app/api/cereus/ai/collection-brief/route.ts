import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { generateContent, generateImages } from '@/lib/ai';
import { COLLECTION_BRIEF_SYSTEM, COLLECTION_BRIEF_USER, buildMoodBoardPrompts } from '@/modules/cereus/lib/ai-prompts';
import type { SupabaseClient } from '@supabase/supabase-js';

// Download a temporary DALL-E URL and upload to Supabase Storage, return public URL
async function downloadAndUploadToStorage(
  imageUrl: string,
  storagePath: string,
  db: SupabaseClient
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    const { error } = await db.storage
      .from('cereus-garment-images')
      .upload(storagePath, buffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error.message);
      return null;
    }

    const { data: urlData } = db.storage
      .from('cereus-garment-images')
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Download/upload failed:', err);
    return null;
  }
}

// POST /api/cereus/ai/collection-brief — Generate AI collection concept + mood board images
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { maisonId, season, year, targetPieces, trendContext, language, autoCreate, generateMoodImages } = body;

  if (!maisonId || !season || !year) {
    return NextResponse.json({ error: 'maisonId, season, and year required' }, { status: 400 });
  }

  // Fetch context data in parallel
  const [maisonRes, archetypesRes, collectionsRes, materialsRes] = await Promise.all([
    db.from('app_clients').select('name').eq('id', maisonId).single(),
    db.from('cereus_emotional_profiles')
      .select('primary_archetype')
      .eq('is_current', true)
      .not('primary_archetype', 'is', null),
    db.from('cereus_collections')
      .select('name, season, year')
      .eq('maison_id', maisonId)
      .order('year', { ascending: false })
      .limit(10),
    db.from('cereus_materials')
      .select('name, type, composition')
      .eq('maison_id', maisonId)
      .eq('activo', true)
      .limit(20),
  ]);

  const maisonName = maisonRes.data?.name || 'Maison';

  // Calculate archetype distribution
  const archetypeMap: Record<string, number> = {};
  (archetypesRes.data || []).forEach((p: { primary_archetype: string }) => {
    archetypeMap[p.primary_archetype] = (archetypeMap[p.primary_archetype] || 0) + 1;
  });
  const archetypeDistribution = Object.entries(archetypeMap).map(([archetype, count]) => ({
    archetype,
    count,
  }));

  try {
    const context = {
      maison_name: maisonName,
      season,
      year: parseInt(year),
      target_pieces: targetPieces || 12,
      archetype_distribution: archetypeDistribution,
      trend_context: trendContext,
      available_materials: (materialsRes.data || []).map((m: { name: string; type: string; composition: string | null }) => ({
        name: m.name,
        type: m.type,
        composition: m.composition || undefined,
      })),
      existing_collections: (collectionsRes.data || []).map((c: { name: string; season: string; year: number }) => ({
        name: c.name,
        season: c.season,
        year: c.year,
      })),
      language: language || 'es',
    };

    const result = await generateContent({
      prompt: COLLECTION_BRIEF_USER(context),
      systemPrompt: COLLECTION_BRIEF_SYSTEM,
      maxTokens: 2000,
      temperature: 0.8,
    });

    // Parse JSON from response
    let brief = null;
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        brief = JSON.parse(jsonMatch[0]);
      }
    } catch {
      return NextResponse.json({
        error: 'Failed to parse AI response',
        raw: result.content,
      }, { status: 500 });
    }

    // ============================================================
    // Generate mood board images via DALL-E (if requested and brief exists)
    // ============================================================
    let moodBoardUrls: string[] = [];

    // Default to true — generate images unless explicitly disabled
    const shouldGenerateImages = generateMoodImages !== false;

    if (brief && shouldGenerateImages) {
      try {
        const imagePrompts = buildMoodBoardPrompts(brief, season, maisonName);
        const dalleResults = await generateImages(imagePrompts, {
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid',
        });

        // Download temp DALL-E URLs and upload to permanent Supabase Storage
        const timestamp = Date.now();
        const uploadPromises = dalleResults.map((img, i) =>
          downloadAndUploadToStorage(
            img.url,
            `collections/ai-moodboard/${timestamp}_${i}.png`,
            db
          )
        );

        const uploadedUrls = await Promise.all(uploadPromises);
        moodBoardUrls = uploadedUrls.filter((url): url is string => url !== null);
      } catch (imgErr) {
        // Image generation is non-blocking — log and continue with text-only brief
        console.error('Mood board image generation failed:', imgErr);
      }
    }

    // Optionally auto-create collection
    let collection = null;
    if (autoCreate && brief) {
      const { data: newCollection, error: createError } = await db
        .from('cereus_collections')
        .insert({
          maison_id: maisonId,
          designer_id: user.id,
          name: brief.name_suggestions?.[0] || `${season} ${year}`,
          code: brief.code_suggestion || `${season.substring(0, 2).toUpperCase()}${String(year).slice(-2)}`,
          description: brief.description || '',
          season,
          year: parseInt(year),
          inspiration_notes: brief.inspiration_notes || '',
          mood_board_urls: moodBoardUrls.length > 0 ? moodBoardUrls : null,
          status: 'concept',
          target_pieces: targetPieces || brief.garment_types?.reduce((sum: number, g: { count: number }) => sum + g.count, 0) || 12,
          avg_price_point: brief.estimated_avg_price || null,
        })
        .select()
        .single();

      if (!createError) collection = newCollection;
    }

    return NextResponse.json({
      brief,
      moodBoardUrls,
      collection,
      provider: result.provider,
      success: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
