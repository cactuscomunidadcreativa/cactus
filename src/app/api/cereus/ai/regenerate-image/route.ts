import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getAPIKey } from '@/lib/ai/config';
import { uploadImageToSupabase } from '@/modules/cereus/lib/image-upload';

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
  const { garmentId, action, editPrompt, annotatedCanvasData, correctionNotes } = body;

  // ─── AI Correction Mode (Apple Pencil annotations) ───
  if (action === 'correct') {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI correction not configured' }, { status: 500 });
    }

    // Step 1: Claude Vision analyzes annotated sketch
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/png', data: annotatedCanvasData.replace('data:image/png;base64,', '') },
            },
            {
              type: 'text',
              text: `You are a fashion design AI assistant. Analyze this fashion sketch annotated by a designer with corrections in orange/red color.

Identify:
1. Parts crossed out or marked for removal
2. New lines or shapes drawn (additions)
3. Written notes or annotations
4. Overall correction intent

${correctionNotes ? `Designer notes: ${correctionNotes}` : ''}

Generate a detailed DALL-E prompt (in English) for the corrected fashion sketch. Professional illustration on white background.

Respond with ONLY the DALL-E prompt, nothing else.`,
            },
          ],
        }],
      }),
    });

    const claudeData = await anthropicRes.json();
    const correctedPrompt = claudeData.content?.[0]?.text || '';
    if (!correctedPrompt) {
      return NextResponse.json({ error: 'Failed to analyze corrections' }, { status: 500 });
    }

    // Step 2: Generate corrected sketch with DALL-E
    const corrOpenaiKey = await getAPIKey('openai');
    if (!corrOpenaiKey) {
      return NextResponse.json({ error: 'Image generation not configured' }, { status: 500 });
    }

    const dalleRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${corrOpenaiKey}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt: correctedPrompt.substring(0, 4000), n: 1, size: '1024x1024', quality: 'hd' }),
    });

    const dalleData = await dalleRes.json();
    const corrDalleUrl = dalleData.data?.[0]?.url;
    if (!corrDalleUrl) {
      return NextResponse.json({ error: 'Failed to generate corrected image' }, { status: 502 });
    }

    // Step 3: Upload with retry
    const { permanentUrl, warning: uploadWarning } = await uploadImageToSupabase(db, corrDalleUrl, 'sketches');
    return NextResponse.json({
      imageUrl: permanentUrl || corrDalleUrl,
      correctedPrompt,
      source: 'dall-e-corrected',
      warning: uploadWarning,
    });
  }

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
        quality: 'hd',
        response_format: 'url',
      }),
    });

    const data = await res.json();
    const dalleUrl = data.data?.[0]?.url;

    if (!dalleUrl) {
      return NextResponse.json({ error: 'DALL-E generation failed', details: data }, { status: 500 });
    }

    // Upload to Supabase with retry for permanent URL
    const { permanentUrl: uploadedUrl, warning: uploadWarning } = await uploadImageToSupabase(db, dalleUrl, 'sketches');
    const permanentUrl = uploadedUrl || dalleUrl;

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
