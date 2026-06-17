import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateImage } from '@/lib/ai';
import { estimateCostUsd, usdToCredits } from '@/lib/cactus/credits';

export const maxDuration = 60;

const SIZE: Record<string, '1024x1024' | '1024x1792' | '1792x1024'> = {
  square: '1024x1024',
  story: '1024x1792',
  wide: '1792x1024',
};

const STYLE_HINT: Record<string, string> = {
  vivid: 'colores vibrantes, alto contraste, llamativo',
  natural: 'estética natural, suave y realista',
};

export async function POST(req: Request) {
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }
  if (!body?.brief) return NextResponse.json({ error: 'Describe la pieza a diseñar.' }, { status: 400 });

  const format = body.format || 'square';
  const style = body.style === 'natural' ? 'natural' : 'vivid';
  const brand = body.brandName ? `para la marca "${body.brandName}"` : '';

  const prompt = `Diseño gráfico profesional ${brand}: ${body.brief}. ${STYLE_HINT[style]}. Composición limpia y equilibrada, calidad publicitaria, lista para redes sociales. Evita texto ilegible o deformado.`;

  try {
    const img = await generateImage({ prompt, size: SIZE[format] || SIZE.square, quality: 'standard', style });
    const costUsd = estimateCostUsd({ model: 'gpt-image', images: 1 });
    return NextResponse.json({
      url: img.url,
      revisedPrompt: img.revisedPrompt,
      credits: usdToCredits(costUsd),
      costUsd,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error generando la pieza' }, { status: 500 });
  }
}
