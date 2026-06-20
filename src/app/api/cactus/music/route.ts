import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getIntegrationKey } from '@/lib/ai/config';
import { usdToCredits } from '@/lib/cactus/credits';

export const maxDuration = 60;

// Genera música con Replicate (MusicGen de Meta). Plataforma-provista (admin).
export async function POST(req: Request) {
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = await getIntegrationKey('replicate');
  if (!key) return NextResponse.json({ error: 'Música no configurada. El administrador debe añadir la llave de Replicate.' }, { status: 400 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }
  const prompt = String(body?.prompt || '').trim();
  if (!prompt) return NextResponse.json({ error: 'Describe la música (género, mood, instrumentos).' }, { status: 400 });
  const duration = Math.min(30, Math.max(5, Number(body?.duration) || 12));

  try {
    // Usa la versión por defecto del modelo; Prefer: wait para respuesta síncrona.
    let res = await fetch('https://api.replicate.com/v1/models/meta/musicgen/predictions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'wait' },
      body: JSON.stringify({ input: { prompt, duration, model_version: 'stereo-large', output_format: 'mp3' } }),
    });
    let pred = await res.json();
    if (!res.ok) return NextResponse.json({ error: pred?.detail || `Replicate error ${res.status}` }, { status: 500 });

    // Respaldo: si quedó procesando, poll corto.
    for (let i = 0; i < 20 && (pred.status === 'starting' || pred.status === 'processing'); i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const poll = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${key}` } });
      pred = await poll.json();
    }

    if (pred.status !== 'succeeded') {
      return NextResponse.json({ error: pred?.error || 'No se pudo generar la música (intenta de nuevo).' }, { status: 500 });
    }
    const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
    const costUsd = duration * 0.002; // estimación
    return NextResponse.json({ url, credits: usdToCredits(costUsd), costUsd });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error generando música' }, { status: 500 });
  }
}
