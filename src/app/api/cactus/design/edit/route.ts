import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { editImage } from '@/lib/ai';
import { estimateCostUsd, usdToCredits } from '@/lib/cactus/credits';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SIZE: Record<string, '1024x1024' | '1024x1792' | '1792x1024'> = {
  square: '1024x1024', story: '1024x1792', wide: '1792x1024',
};

// POST (multipart: image + prompt + format) → edita la imagen con IA (gpt-image-1).
export async function POST(req: Request) {
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }
  const file = form.get('image') as File | null;
  const rawPrompt = String(form.get('prompt') || '').trim();
  const format = String(form.get('format') || 'square');
  const mode = String(form.get('mode') || '');
  if (!file || typeof file.arrayBuffer !== 'function') return NextResponse.json({ error: 'Falta la imagen.' }, { status: 400 });
  if (!rawPrompt) return NextResponse.json({ error: 'Describe el cambio a aplicar.' }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Imagen muy grande (máx 8 MB).' }, { status: 400 });

  // En modo avatar/foto preservamos la identidad de la persona de la foto.
  const prompt = (mode === 'avatar' || mode === 'photo')
    ? `Mantén EXACTAMENTE a la misma persona de la foto: mismo rostro, rasgos faciales, estructura ósea, tono de piel, barba, lentes y peinado. NO cambies su identidad ni la conviertas en otra persona. ${rawPrompt}. Retrato profesional fotorrealista, iluminación de estudio, fondo neutro, alta fidelidad.`
    : rawPrompt;

  const blob = new Blob([await file.arrayBuffer()], { type: file.type || 'image/png' });

  try {
    const img = await editImage({ image: blob, prompt, size: SIZE[format] || SIZE.square });
    const costUsd = estimateCostUsd({ model: 'gpt-image', images: 1 });
    return NextResponse.json({ url: img.url, revisedPrompt: img.revisedPrompt, credits: usdToCredits(costUsd), costUsd });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error editando la imagen' }, { status: 500 });
  }
}
