import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateImage } from '@/lib/ai';
import { estimateCostUsd, usdToCredits } from '@/lib/cactus/credits';
import { persistImage } from '@/lib/cactus/image-store';

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

  const MODE_PREFIX: Record<string, string> = {
    design: 'Diseño gráfico profesional de marca, jerarquía visual clara, vectorial y pulido',
    photo: 'Fotografía profesional editorial y de producto, iluminación de estudio cuidada, enfoque nítido, calidad de revista',
    avatar: 'Retrato fotorrealista de avatar de marca: persona real y creíble, piel y ojos de alta fidelidad, iluminación de estudio suave, fondo neutro desenfocado, encuadre de cabeza y hombros, mirada a cámara, expresión cálida y profesional',
    character: 'Diseño de personaje/mascota de marca: ilustración 3D pulida y expresiva, formas limpias, paleta coherente, pose con personalidad, fondo simple',
  };
  const prefix = MODE_PREFIX[body.mode as string] || MODE_PREFIX.design;

  // Para avatar/foto evitamos lenguaje de "ilustración" y reforzamos realismo.
  const realism = (body.mode === 'avatar' || body.mode === 'photo')
    ? 'Resultado fotorrealista, detalle natural, sin aspecto de dibujo ni 3D plástico.'
    : '';

  const prompt = `${prefix} ${brand}: ${body.brief}. ${STYLE_HINT[style]}. ${realism} Composición equilibrada, alta calidad y lista para usar. Evita texto ilegible o deformado; manos y rasgos anatómicamente correctos.`;

  try {
    const img = await generateImage({ prompt, size: SIZE[format] || SIZE.square, quality: 'standard', style });
    // Re-sube a Storage: la URL de OpenAI es temporal (~1h); persistir evita que el
    // preview/entregable se rompa al rato.
    const permanentUrl = await persistImage(img.url, { scope: 'design', slug: String(body.mode || 'design') });
    const costUsd = estimateCostUsd({ model: 'gpt-image', images: 1 });
    return NextResponse.json({
      url: permanentUrl,
      revisedPrompt: img.revisedPrompt,
      credits: usdToCredits(costUsd),
      costUsd,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error generando la pieza' }, { status: 500 });
  }
}
