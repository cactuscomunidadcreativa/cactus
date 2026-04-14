import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getAPIKey } from '@/lib/ai/config';
import { getTrainingContext } from '@/modules/cereus/lib/ai-training-context';
import { uploadImageToSupabase } from '@/modules/cereus/lib/image-upload';

// ─── TYPES ──────────────────────────────────────────────────

type PrintScale = 'pequeno' | 'mediano' | 'grande';

interface GeneratePrintBody {
  maisonId: string;
  style: string;
  colors: string[];
  motifs: string;
  scale: PrintScale;
  repeat: boolean;
  collectionConcept?: string;
  referenceDescription?: string;
}

// ─── SVG FALLBACK GENERATORS ────────────────────────────────

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildFloralSVG(colors: string[], scale: PrintScale): string {
  const size = scale === 'pequeno' ? 64 : scale === 'mediano' ? 128 : 192;
  const r = size * 0.15;
  const cx = size / 2;
  const cy = size / 2;
  const c1 = colors[0] || '#c7a86b';
  const c2 = colors[1] || '#e8d5b7';
  const c3 = colors[2] || '#8b6f47';

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `  <rect width="${size}" height="${size}" fill="#faf8f5"/>`,
    // petals
    `  <circle cx="${cx}" cy="${cy - r}" r="${r}" fill="${c1}" opacity="0.7"/>`,
    `  <circle cx="${cx + r}" cy="${cx}" r="${r}" fill="${c1}" opacity="0.6"/>`,
    `  <circle cx="${cx}" cy="${cy + r}" r="${r}" fill="${c1}" opacity="0.7"/>`,
    `  <circle cx="${cx - r}" cy="${cy}" r="${r}" fill="${c1}" opacity="0.6"/>`,
    // center
    `  <circle cx="${cx}" cy="${cy}" r="${r * 0.5}" fill="${c2}"/>`,
    // leaf accents
    `  <ellipse cx="${cx - r * 1.5}" cy="${cy + r * 1.5}" rx="${r * 0.6}" ry="${r * 0.25}" transform="rotate(-30 ${cx - r * 1.5} ${cy + r * 1.5})" fill="${c3}" opacity="0.6"/>`,
    `  <ellipse cx="${cx + r * 1.5}" cy="${cy + r * 1.5}" rx="${r * 0.6}" ry="${r * 0.25}" transform="rotate(30 ${cx + r * 1.5} ${cy + r * 1.5})" fill="${c3}" opacity="0.6"/>`,
    '</svg>',
  ].join('\n');
}

function buildGeometricSVG(colors: string[], scale: PrintScale): string {
  const size = scale === 'pequeno' ? 64 : scale === 'mediano' ? 128 : 192;
  const c1 = colors[0] || '#c7a86b';
  const c2 = colors[1] || '#e8d5b7';
  const half = size / 2;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `  <rect width="${size}" height="${size}" fill="#faf8f5"/>`,
    `  <polygon points="${half},${size * 0.1} ${size * 0.9},${size * 0.9} ${size * 0.1},${size * 0.9}" fill="${c1}" opacity="0.5"/>`,
    `  <polygon points="${half},${size * 0.3} ${size * 0.75},${size * 0.75} ${size * 0.25},${size * 0.75}" fill="${c2}" opacity="0.6"/>`,
    `  <line x1="0" y1="${half}" x2="${size}" y2="${half}" stroke="${c1}" stroke-width="1" opacity="0.3"/>`,
    `  <line x1="${half}" y1="0" x2="${half}" y2="${size}" stroke="${c1}" stroke-width="1" opacity="0.3"/>`,
    '</svg>',
  ].join('\n');
}

function buildAbstractSVG(colors: string[], scale: PrintScale): string {
  const size = scale === 'pequeno' ? 64 : scale === 'mediano' ? 128 : 192;
  const c1 = colors[0] || '#c7a86b';
  const c2 = colors[1] || '#e8d5b7';
  const c3 = colors[2] || '#8b6f47';
  const s = size;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">`,
    `  <rect width="${s}" height="${s}" fill="#faf8f5"/>`,
    `  <ellipse cx="${s * 0.3}" cy="${s * 0.35}" rx="${s * 0.22}" ry="${s * 0.18}" fill="${c1}" opacity="0.55"/>`,
    `  <ellipse cx="${s * 0.7}" cy="${s * 0.6}" rx="${s * 0.2}" ry="${s * 0.25}" fill="${c2}" opacity="0.5"/>`,
    `  <circle cx="${s * 0.5}" cy="${s * 0.2}" r="${s * 0.1}" fill="${c3}" opacity="0.4"/>`,
    `  <path d="M${s * 0.1},${s * 0.8} Q${s * 0.5},${s * 0.6} ${s * 0.9},${s * 0.85}" stroke="${c1}" stroke-width="2" fill="none" opacity="0.4"/>`,
    '</svg>',
  ].join('\n');
}

function buildStripesSVG(colors: string[], scale: PrintScale): string {
  const size = scale === 'pequeno' ? 64 : scale === 'mediano' ? 128 : 192;
  const stripeW = size / (colors.length || 3) / 2;
  const rects: string[] = [];
  const usedColors = colors.length ? colors : ['#c7a86b', '#e8d5b7', '#8b6f47'];

  for (let i = 0; i < size; i += stripeW) {
    const color = usedColors[Math.floor(i / stripeW) % usedColors.length];
    rects.push(`  <rect x="${i}" y="0" width="${stripeW}" height="${size}" fill="${color}" opacity="0.6"/>`);
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `  <rect width="${size}" height="${size}" fill="#faf8f5"/>`,
    ...rects,
    '</svg>',
  ].join('\n');
}

function buildDotsSVG(colors: string[], scale: PrintScale): string {
  const size = scale === 'pequeno' ? 64 : scale === 'mediano' ? 128 : 192;
  const gap = size / 4;
  const r = gap * 0.25;
  const c1 = colors[0] || '#c7a86b';
  const dots: string[] = [];

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const cx = gap * col + gap / 2;
      const cy = gap * row + gap / 2;
      const offset = row % 2 === 1 ? gap / 2 : 0;
      dots.push(`  <circle cx="${cx + offset}" cy="${cy}" r="${r}" fill="${c1}" opacity="0.6"/>`);
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `  <rect width="${size}" height="${size}" fill="#faf8f5"/>`,
    ...dots,
    '</svg>',
  ].join('\n');
}

function generateFallbackSVG(style: string, colors: string[], scale: PrintScale): string {
  const lower = style.toLowerCase();
  if (lower.includes('floral') || lower.includes('tropical') || lower.includes('paisley'))
    return buildFloralSVG(colors, scale);
  if (lower.includes('geometric') || lower.includes('geom') || lower.includes('etnico') || lower.includes('étnico'))
    return buildGeometricSVG(colors, scale);
  if (lower.includes('raya') || lower.includes('stripe'))
    return buildStripesSVG(colors, scale);
  if (lower.includes('punto') || lower.includes('dot'))
    return buildDotsSVG(colors, scale);
  // abstract / animal / default
  return buildAbstractSVG(colors, scale);
}

// ─── DALL-E PROMPT ──────────────────────────────────────────

function buildDallePrompt(body: GeneratePrintBody): string {
  const parts = [
    'Seamless textile print pattern for haute couture fabric.',
    `Style: ${body.style}.`,
    `Motifs: ${body.motifs}.`,
    `Scale: ${body.scale}.`,
    `Color palette: ${body.colors.join(', ')}.`,
  ];

  if (body.collectionConcept) {
    parts.push(`Collection concept: ${body.collectionConcept}.`);
  }
  if (body.referenceDescription) {
    parts.push(`Reference inspiration: ${body.referenceDescription}.`);
  }

  parts.push(
    'The pattern should be: repeatable tile, high resolution, suitable for fabric printing, fashion-forward, not generic stock pattern.',
    'White/cream background. No text, no watermarks.',
  );

  return parts.join(' ');
}

// ─── POST HANDLER ───────────────────────────────────────────

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
  let body: GeneratePrintBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { maisonId, style, colors, motifs, scale, repeat } = body;

  if (!maisonId || !style || !colors?.length || !motifs || !scale) {
    return NextResponse.json(
      { error: 'maisonId, style, colors, motifs, and scale are required' },
      { status: 400 },
    );
  }

  let prompt = buildDallePrompt(body);

  // 3. Load AI training context for brand-aware generation
  const trainingContext = await getTrainingContext(maisonId);
  if (trainingContext) {
    // Append key brand preferences to the DALL-E prompt (condensed for image generation)
    prompt += ` Brand design context: ${trainingContext.substring(0, 1500)}`;
  }

  // 4. Check for OpenAI key
  const openaiKey = await getAPIKey('openai');

  // 5. Fallback: generate SVG pattern when no API key available
  if (!openaiKey) {
    const svgData = generateFallbackSVG(style, colors, scale);
    return NextResponse.json({
      svgData,
      source: 'svg-fallback' as const,
      prompt,
    });
  }

  // 6. Generate via DALL-E 3
  try {
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
        quality: 'hd',
      }),
    });

    if (!dalleRes.ok) {
      const err = await dalleRes.text();
      console.error('DALL-E API error:', err);
      return NextResponse.json({ error: 'Print generation failed' }, { status: 502 });
    }

    const dalleData = await dalleRes.json();
    const dalleUrl: string | undefined = dalleData?.data?.[0]?.url;

    if (!dalleUrl) {
      return NextResponse.json({ error: 'No image returned from DALL-E' }, { status: 502 });
    }

    // 7. Upload to Supabase with retry for permanent URL
    const db = createServiceClient();
    let finalUrl = dalleUrl;
    let uploadWarning: string | null = null;
    if (db) {
      const result = await uploadImageToSupabase(db, dalleUrl, 'prints');
      finalUrl = result.permanentUrl || dalleUrl;
      uploadWarning = result.warning;
    }

    return NextResponse.json({
      imageUrl: finalUrl,
      source: 'dall-e' as const,
      prompt,
      warning: uploadWarning,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Print generation failed';
    console.error('generate-print error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
