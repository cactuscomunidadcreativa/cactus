import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { editImage } from '@/lib/ai';
import { getIntegrationKey } from '@/lib/ai/config';
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

  const bytes = Buffer.from(await file.arrayBuffer());

  // ── Avatar/foto: Flux Kontext (Replicate) PRESERVA la identidad mucho mejor
  //    que gpt-image. Si hay key de Replicate, lo usamos para no cambiar la cara.
  const replicate = (mode === 'avatar' || mode === 'photo') ? await getIntegrationKey('replicate') : '';
  if (replicate) {
    try {
      const dataUri = `data:${file.type || 'image/jpeg'};base64,${bytes.toString('base64')}`;
      const kPrompt = `${rawPrompt}. Keep the exact same person and face — same facial features, bone structure, skin tone, beard and glasses. Do not change their identity. Professional headshot, studio lighting, neutral background, photorealistic.`;
      let res = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${replicate}`, 'Content-Type': 'application/json', Prefer: 'wait' },
        body: JSON.stringify({ input: { prompt: kPrompt, input_image: dataUri, aspect_ratio: 'match_input_image', output_format: 'jpg', safety_tolerance: 2 } }),
      });
      let pred = await res.json();
      if (!res.ok) console.error('[design/edit] flux-kontext create error', res.status, JSON.stringify(pred).slice(0, 300));
      if (res.ok) {
        for (let i = 0; i < 25 && (pred.status === 'starting' || pred.status === 'processing'); i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const poll = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${replicate}` } });
          pred = await poll.json();
        }
        const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
        if (pred.status === 'succeeded' && url) {
          const costUsd = 0.04;
          return NextResponse.json({ url, credits: usdToCredits(costUsd), costUsd, engine: 'flux-kontext' });
        }
        console.error('[design/edit] flux-kontext no-success', pred?.status, JSON.stringify(pred?.error || pred).slice(0, 300));
      }
      // si Kontext falla, caemos a gpt-image abajo
    } catch (e: any) { console.error('[design/edit] flux-kontext threw', e?.message); }
  }

  // ── Respaldo: gpt-image edit (puede variar más la cara) ────────────────────
  const blob = new Blob([bytes], { type: file.type || 'image/png' });
  try {
    const img = await editImage({ image: blob, prompt, size: SIZE[format] || SIZE.square });
    const costUsd = estimateCostUsd({ model: 'gpt-image', images: 1 });
    return NextResponse.json({ url: img.url, revisedPrompt: img.revisedPrompt, credits: usdToCredits(costUsd), costUsd, engine: 'gpt-image' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error editando la imagen' }, { status: 500 });
  }
}
