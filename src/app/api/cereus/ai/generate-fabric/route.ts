import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getAPIKey } from '@/lib/ai/config';
import { getTrainingContext } from '@/modules/cereus/lib/ai-training-context';

interface ColorEntry {
  hex: string;
  name: string;
}

interface GenerateFabricBody {
  maisonId: string;
  collectionConcept: string;
  colorStory: ColorEntry[];
  fabricKeywords: string[];
  season: string;
  lang?: string;
}

function buildFallbackSVG(primaryColor: string, name: string): string {
  const hex = primaryColor.startsWith('#') ? primaryColor : `#${primaryColor}`;
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">',
    `  <rect width="256" height="256" fill="${hex}" />`,
    `  <text x="128" y="138" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#fff" opacity="0.7">${name}</text>`,
    '</svg>',
  ].join('\n');
}

function buildDallePrompt(
  concept: string,
  colors: ColorEntry[],
  keywords: string[],
  season: string,
): string {
  const colorList = colors.map((c) => `${c.name} (${c.hex})`).join(', ');
  const keywordList = keywords.join(', ');

  return [
    'Create a seamless tileable fabric texture pattern suitable for fashion design.',
    `Collection concept: ${concept}.`,
    `Color palette: ${colorList}.`,
    `Fabric characteristics: ${keywordList}.`,
    `Season: ${season}.`,
    'The pattern should be photorealistic, showing the weave and material texture.',
    'The image must tile seamlessly on all edges. No text, no labels, no watermarks.',
  ].join(' ');
}

function suggestNameFromKeywords(keywords: string[], season: string): string {
  const base = keywords.slice(0, 2).join(' ') || 'Custom Fabric';
  return `${base} — ${season}`.replace(/^\w/, (c) => c.toUpperCase());
}

function suggestComposition(keywords: string[]): string {
  const lower = keywords.map((k) => k.toLowerCase());
  if (lower.some((k) => k.includes('silk'))) return '100% Silk';
  if (lower.some((k) => k.includes('linen'))) return '100% Linen';
  if (lower.some((k) => k.includes('wool'))) return '100% Wool';
  if (lower.some((k) => k.includes('cotton'))) return '100% Cotton';
  if (lower.some((k) => k.includes('denim'))) return '100% Cotton Denim';
  if (lower.some((k) => k.includes('satin'))) return '97% Polyester, 3% Elastane';
  if (lower.some((k) => k.includes('tweed'))) return '80% Wool, 20% Polyamide';
  return '70% Cotton, 30% Polyester';
}

// POST /api/cereus/ai/generate-fabric — Generate a fabric texture via DALL-E or fallback
export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse body
  const body: GenerateFabricBody = await request.json();
  const { maisonId, collectionConcept, colorStory, fabricKeywords, season } = body;

  if (!maisonId || !collectionConcept || !colorStory?.length || !fabricKeywords?.length || !season) {
    return NextResponse.json(
      { error: 'maisonId, collectionConcept, colorStory, fabricKeywords, and season are required' },
      { status: 400 },
    );
  }

  const suggestedName = suggestNameFromKeywords(fabricKeywords, season);
  const suggestedComposition = suggestComposition(fabricKeywords);

  // 3. Load AI training context for brand-aware generation
  const trainingContext = await getTrainingContext(maisonId);

  // 4. Check for OpenAI key
  const openaiKey = await getAPIKey('openai');

  // 5. Fallback: return an SVG color swatch when no API key is available
  if (!openaiKey) {
    const primaryColor = colorStory[0]?.hex || '#888888';
    const svg = buildFallbackSVG(primaryColor, colorStory[0]?.name || 'Swatch');
    const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg, 'utf-8').toString('base64')}`;

    return NextResponse.json({
      imageUrl: dataUri,
      suggestedName,
      suggestedComposition,
      source: 'fallback' as const,
    });
  }

  // 6. Generate via DALL-E 3
  try {
    let prompt = buildDallePrompt(collectionConcept, colorStory, fabricKeywords, season);
    if (trainingContext) {
      // Append key brand preferences to the DALL-E prompt (condensed for image generation)
      prompt += ` Brand design context: ${trainingContext.substring(0, 500)}`;
    }

    const dalleRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    });

    if (!dalleRes.ok) {
      const err = await dalleRes.text();
      console.error('DALL-E API error:', err);
      return NextResponse.json({ error: 'Image generation failed' }, { status: 502 });
    }

    const dalleData = await dalleRes.json();
    const dalleUrl: string | undefined = dalleData?.data?.[0]?.url;

    if (!dalleUrl) {
      return NextResponse.json({ error: 'No image returned from DALL-E' }, { status: 502 });
    }

    // 7. Download the temporary DALL-E URL and upload to Supabase Storage
    const db = createServiceClient();
    if (!db) {
      // If service client isn't configured, return the temporary DALL-E URL directly
      return NextResponse.json({
        imageUrl: dalleUrl,
        suggestedName,
        suggestedComposition,
        source: 'dall-e' as const,
      });
    }

    const imageRes = await fetch(dalleUrl);
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const filePath = `fabrics/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

    const { error: uploadError } = await db.storage
      .from('cereus-garment-images')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError.message);
      // Fall back to temporary URL if upload fails
      return NextResponse.json({
        imageUrl: dalleUrl,
        suggestedName,
        suggestedComposition,
        source: 'dall-e' as const,
      });
    }

    const { data: publicData } = db.storage
      .from('cereus-garment-images')
      .getPublicUrl(filePath);

    return NextResponse.json({
      imageUrl: publicData.publicUrl,
      suggestedName,
      suggestedComposition,
      source: 'dall-e' as const,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fabric generation failed';
    console.error('generate-fabric error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
