import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { generateContent } from '@/lib/ai';
import {
  RAMONA_FASHION_CAMPAIGN_SYSTEM,
  RAMONA_FASHION_CAMPAIGN_USER,
} from '@/modules/cereus/lib/ai-prompts';

// POST /api/cereus/ai/ramona-campaign — Generate social media content for RAMONA
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { collectionId, maisonId, platforms, count, themes, language } = body;

  if (!collectionId || !maisonId || !platforms?.length || !count) {
    return NextResponse.json({ error: 'collectionId, maisonId, platforms, and count required' }, { status: 400 });
  }

  if (count > 30) {
    return NextResponse.json({ error: 'Maximum 30 content pieces per request' }, { status: 400 });
  }

  // Fetch collection + garments + materials + maison
  const [collectionRes, garmentsRes, maisonRes] = await Promise.all([
    db.from('cereus_collections').select('*').eq('id', collectionId).single(),
    db.from('cereus_garments')
      .select('name, category, description, cereus_garment_materials(cereus_materials(name, type, composition))')
      .eq('collection_id', collectionId)
      .limit(15),
    db.from('app_clients').select('name').eq('id', maisonId).single(),
  ]);

  const collection = collectionRes.data;
  if (!collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });

  const maisonName = maisonRes.data?.name || 'Maison';

  // Extract unique materials from garments
  const materialSet = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const garments = (garmentsRes.data || []).map((g: any) => {
    (g.cereus_garment_materials || []).forEach((gm: any) => {
      const mat = gm.cereus_materials;
      if (mat?.name) materialSet.add(mat.name);
    });
    return { name: g.name, category: g.category, description: g.description || undefined };
  });

  // Extract color story from collection mood_board_urls if available
  const colorStory: string[] = [];
  if (collection.mood_board_urls?.color_story) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    collection.mood_board_urls.color_story.forEach((c: any) => {
      colorStory.push(c.name || c);
    });
  }

  // Check/create RAMONA brand for this maison
  let { data: brand } = await db
    .from('rm_brands')
    .select('id')
    .eq('user_id', user.id)
    .ilike('name', `%${maisonName}%`)
    .limit(1)
    .single();

  if (!brand) {
    const { data: newBrand, error: brandError } = await db
      .from('rm_brands')
      .insert({
        user_id: user.id,
        name: `${maisonName} - CEREUS`,
        industry: 'Haute Couture / Luxury Fashion',
        tone: ['elegante', 'exclusivo', 'sofisticado', 'aspiracional'],
        keywords: ['alta costura', 'bespoke', 'atelier', collection.name || ''],
        value_proposition: `${maisonName} — Emotional algorithmic atelier. ${collection.description || ''}`,
      })
      .select('id')
      .single();

    if (brandError) return NextResponse.json({ error: `Failed to create RAMONA brand: ${brandError.message}` }, { status: 500 });
    brand = newBrand;
  }

  try {
    const context = {
      maison_name: maisonName,
      collection_name: collection.name,
      collection_description: collection.description || '',
      collection_mood: collection.inspiration_notes || collection.description || '',
      garments,
      materials: Array.from(materialSet),
      color_story: colorStory.length > 0 ? colorStory : ['gold', 'noir', 'ivory'],
      platforms,
      count,
      themes,
      language: language || 'es',
    };

    const result = await generateContent({
      prompt: RAMONA_FASHION_CAMPAIGN_USER(context),
      systemPrompt: RAMONA_FASHION_CAMPAIGN_SYSTEM,
      maxTokens: 3000,
      temperature: 0.8,
    });

    // Parse JSON array from response
    let contentPieces: Array<{
      title: string;
      content: string;
      hashtags: string[];
      platform: string;
      content_type: string;
    }> = [];
    try {
      const jsonMatch = result.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        contentPieces = JSON.parse(jsonMatch[0]);
      }
    } catch {
      return NextResponse.json({
        error: 'Failed to parse AI campaign content',
        raw: result.content,
      }, { status: 500 });
    }

    // Save each piece to rm_contents
    let savedCount = 0;
    for (const piece of contentPieces) {
      const { error: insertError } = await db
        .from('rm_contents')
        .insert({
          brand_id: brand!.id,
          user_id: user.id,
          title: piece.title || 'Campaign Post',
          body: piece.content || '',
          platform: piece.platform || platforms[0],
          content_type: piece.content_type || 'post',
          hashtags: piece.hashtags || [],
          status: 'idea',
          ai_generated: true,
        });

      if (!insertError) savedCount++;
    }

    return NextResponse.json({
      contentCount: savedCount,
      totalGenerated: contentPieces.length,
      brandId: brand!.id,
      provider: result.provider,
      success: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI campaign generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
