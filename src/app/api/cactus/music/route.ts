import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getIntegrationKey } from '@/lib/ai/config';
import { usdToCredits } from '@/lib/cactus/credits';

export const maxDuration = 60;

/** Busca recursivamente la primera URL de audio en una respuesta JSON desconocida. */
function findAudioUrl(obj: any, depth = 0): string | null {
  if (!obj || depth > 6) return null;
  if (typeof obj === 'string') return /^https?:\/\/\S+\.(mp3|wav|m4a|ogg)(\?|$)/i.test(obj) ? obj : null;
  if (Array.isArray(obj)) { for (const v of obj) { const u = findAudioUrl(v, depth + 1); if (u) return u; } return null; }
  if (typeof obj === 'object') { for (const v of Object.values(obj)) { const u = findAudioUrl(v, depth + 1); if (u) return u; } }
  return null;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }
  const prompt = String(body?.prompt || '').trim();
  if (!prompt) return NextResponse.json({ error: 'Describe la música (género, mood, instrumentos).' }, { status: 400 });
  const provider = body?.provider === 'kling' ? 'kling' : 'musicgen';

  // ── Kling Sound vía PiAPI — jingles / audio corto (5-10s) ──────────────────
  if (provider === 'kling') {
    const key = await getIntegrationKey('piapi');
    if (!key) return NextResponse.json({ error: 'Kling/PiAPI no configurado. El administrador debe añadir la llave de PiAPI.' }, { status: 400 });
    const duration = Number(body?.duration) >= 10 ? 10 : 5;
    try {
      const create = await fetch('https://api.piapi.ai/api/v1/task', {
        method: 'POST', headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'kling', task_type: 'sound', input: { prompt, duration }, config: { service_mode: 'public' } }),
      });
      const created = await create.json();
      if (!create.ok) return NextResponse.json({ error: created?.message || `PiAPI error ${create.status}` }, { status: 500 });
      const taskId = created?.data?.task_id || created?.task_id;
      if (!taskId) return NextResponse.json({ error: 'PiAPI no devolvió task_id.' }, { status: 500 });

      let url = findAudioUrl(created);
      for (let i = 0; i < 25 && !url; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const poll = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, { headers: { 'x-api-key': key } });
        const data = await poll.json();
        const status = data?.data?.status || data?.status;
        url = findAudioUrl(data);
        if (!url && (status === 'failed' || status === 'error')) {
          return NextResponse.json({ error: data?.data?.error?.message || 'Kling no pudo generar el audio.' }, { status: 500 });
        }
      }
      if (!url) return NextResponse.json({ error: 'Tardó demasiado. Intenta de nuevo.' }, { status: 500 });
      const costUsd = 0.07;
      return NextResponse.json({ url, credits: usdToCredits(costUsd), costUsd, provider: 'kling' });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'Error con Kling/PiAPI' }, { status: 500 });
    }
  }

  // ── MusicGen vía Replicate — pistas más largas y musicales ─────────────────
  const key = await getIntegrationKey('replicate');
  if (!key) return NextResponse.json({ error: 'Música no configurada. El administrador debe añadir la llave de Replicate.' }, { status: 400 });
  const duration = Math.min(30, Math.max(5, Number(body?.duration) || 12));
  try {
    let res = await fetch('https://api.replicate.com/v1/models/meta/musicgen/predictions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'wait' },
      body: JSON.stringify({ input: { prompt, duration, model_version: 'stereo-large', output_format: 'mp3' } }),
    });
    let pred = await res.json();
    if (!res.ok) return NextResponse.json({ error: pred?.detail || `Replicate error ${res.status}` }, { status: 500 });
    for (let i = 0; i < 20 && (pred.status === 'starting' || pred.status === 'processing'); i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const poll = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${key}` } });
      pred = await poll.json();
    }
    if (pred.status !== 'succeeded') return NextResponse.json({ error: pred?.error || 'No se pudo generar la música (intenta de nuevo).' }, { status: 500 });
    const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
    const costUsd = duration * 0.002;
    return NextResponse.json({ url, credits: usdToCredits(costUsd), costUsd, provider: 'musicgen' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error generando música' }, { status: 500 });
  }
}
