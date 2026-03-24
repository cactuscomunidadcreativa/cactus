import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getAPIKey } from '@/lib/ai/config';

/**
 * POST /api/cereus/ai/regenerate-image
 * Regenerate a broken/expired image for a garment, or edit an existing one.
 *
 * Body: { garmentId, action: 'regenerate' | 'edit', editPrompt?: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { garmentId, action, editPrompt } = body;

  if (!garmentId) {
    return NextResponse.json({ error: 'garmentId required' }, { status: 400 });
  }

  // Get garment data
  const { data: garment, error: gErr } = await db
    .from('cereus_garments')
    .select('id, name, category, description, design_brief, images, collection_id')
    .eq('id', garmentId)
    .single();

  if (gErr || !garment) {
    return NextResponse.json({ error: 'Garment not found' }, { status: 404 });
  }

  const openaiKey = await getAPIKey('openai');
  if (!openaiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 400 });
  }

  const brief = garment.design_brief as Record<string, unknown> | null;
  const garmentNames: Record<string, string> = {
    dress: 'vestido elegante', gown: 'vestido de gala', suit: 'traje sastre',
    blazer: 'blazer', coat: 'abrigo', skirt: 'falda', pants: 'pantalon',
    blouse: 'blusa', shirt: 'camisa', jumpsuit: 'jumpsuit', cape: 'capa',
    corset: 'corset', top: 'top', accessory: 'accesorio',
  };

  let prompt: string;

  if (action === 'edit' && editPrompt) {
    // Edit existing design with corrections
    const currentDesc = brief?.concept || garment.description || garment.name;
    prompt = `Fashion design illustration. Original design: ${currentDesc}.
CORRECTION REQUESTED: ${editPrompt}.
Style: haute couture pencil sketch on white paper, fashion illustration with 9-head proportions,
minimal background, editorial quality, visible construction lines.
Garment type: ${garmentNames[garment.category] || garment.category}.`;
  } else {
    // Regenerate from brief
    const concept = brief?.concept || garment.description || '';
    const silhouette = brief?.silhouetteNotes || '';
    const fabric = brief?.fabricNotes || '';
    const details = Array.isArray(brief?.constructionDetails)
      ? (brief.constructionDetails as string[]).join('. ')
      : '';

    prompt = `Fashion design illustration of a ${garmentNames[garment.category] || garment.category}.
Concept: ${concept}.
Silhouette: ${silhouette}.
Fabric: ${fabric}.
Details: ${details}.
Style: haute couture pencil sketch on cream paper, fashion illustration with 9-head proportions,
visible construction lines, seam notations, fabric drape indicators, minimal background,
editorial quality, runway-ready design.`;
  }

  try {
    // Generate with DALL-E
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt.substring(0, 4000), // DALL-E has prompt length limits
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url',
      }),
    });

    const data = await res.json();
    const dalleUrl = data.data?.[0]?.url;

    if (!dalleUrl) {
      return NextResponse.json({ error: 'DALL-E generation failed', details: data }, { status: 500 });
    }

    // Download and upload to Supabase for permanent URL
    const imgRes = await fetch(dalleUrl);
    const imgBuffer = await imgRes.arrayBuffer();
    const fileName = `sketches/${Date.now()}_${garment.category}_${action}.png`;

    const { error: upErr } = await db.storage
      .from('cereus-garment-images')
      .upload(fileName, imgBuffer, { contentType: 'image/png', upsert: false });

    if (upErr) {
      return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });
    }

    const { data: urlData } = db.storage.from('cereus-garment-images').getPublicUrl(fileName);
    const permanentUrl = urlData.publicUrl;

    // Update garment images — replace broken ones or add new
    const existingImages = (garment.images as { url: string; type: string }[]) || [];
    let updatedImages: { url: string; type: string }[];

    if (action === 'edit') {
      // Add as new image, keep originals
      updatedImages = [...existingImages, { url: permanentUrl, type: 'ai-edit' }];
    } else {
      // Replace broken images with new one
      updatedImages = existingImages.map(img => {
        if (img.url.includes('oaidalleapiprodscus') || img.url.includes('blob.core.windows')) {
          return { url: permanentUrl, type: 'sketch' };
        }
        return img;
      });
      // If no images were replaced, add it
      if (!existingImages.some(img => img.url.includes('oaidalleapiprodscus') || img.url.includes('blob.core.windows'))) {
        updatedImages = [...existingImages, { url: permanentUrl, type: 'sketch' }];
      }
    }

    // Save to DB
    await db
      .from('cereus_garments')
      .update({ images: updatedImages, updated_at: new Date().toISOString() })
      .eq('id', garmentId);

    return NextResponse.json({
      imageUrl: permanentUrl,
      action,
      prompt: prompt.substring(0, 200) + '...',
      updatedImages,
      success: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
