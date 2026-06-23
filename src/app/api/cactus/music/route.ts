import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getIntegrationKey } from '@/lib/ai/config';
import { guardAiAccess, chargeAiUsage } from '@/lib/cactus/ai-guard';
import { getActiveCompanyId } from '@/lib/cactus/companies';

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
  // Fail-closed: sin Supabase NO se atiende (esta ruta GASTA IA; el viejo
  // `if (supabase)` dejaba pasar tráfico anónimo si faltaba una env var).
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'No disponible.' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }
  const prompt = String(body?.prompt || '').trim();
  if (!prompt) return NextResponse.json({ error: 'Describe la música (género, mood, instrumentos).' }, { status: 400 });
  const provider = body?.provider === 'kling' ? 'kling' : 'musicgen';

  // Gate de acceso + cuota mensual ANTES de gastar IA (cierra la fuga de IA gratis).
  const guard = await guardAiAccess(supabase, user, companyId);
  if (!guard.ok) return guard.response;

  // ── Kling Sound vía PiAPI — jingles / audio corto (5-10s) ──────────────────
  if (provider === 'kling') {
    const key = await getIntegrationKey('piapi');
    if (!key) return NextResponse.json({ error: 'Kling/PiAPI no configurado. El administrador debe añadir la llave de PiAPI.' }, { status: 400 });
    const duration = Number(body?.duration) >= 10 ? 10 : 5;
    try {
      const cctrl = new AbortController();
      const ctimer = setTimeout(() => cctrl.abort(), 30000);
      let created: any;
      let create: Response;
      try {
        create = await fetch('https://api.piapi.ai/api/v1/task', {
          method: 'POST', headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'kling', task_type: 'sound', input: { prompt, duration }, config: { service_mode: 'public' } }),
          signal: cctrl.signal,
        });
        created = await create.json();
      } finally { clearTimeout(ctimer); }
      if (!create.ok) return NextResponse.json({ error: created?.message || `PiAPI error ${create.status}` }, { status: 500 });
      const taskId = created?.data?.task_id || created?.task_id;
      if (!taskId) return NextResponse.json({ error: 'PiAPI no devolvió task_id.' }, { status: 500 });

      let url = findAudioUrl(created);
      for (let i = 0; i < 25 && !url; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const pctrl = new AbortController();
        const ptimer = setTimeout(() => pctrl.abort(), 30000);
        let data: any;
        try {
          const poll = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, { headers: { 'x-api-key': key }, signal: pctrl.signal });
          data = await poll.json();
        } finally { clearTimeout(ptimer); }
        const status = data?.data?.status || data?.status;
        url = findAudioUrl(data);
        if (!url && (status === 'failed' || status === 'error')) {
          return NextResponse.json({ error: data?.data?.error?.message || 'Kling no pudo generar el audio.' }, { status: 500 });
        }
      }
      if (!url) return NextResponse.json({ error: 'Tardó demasiado. Intenta de nuevo.' }, { status: 500 });
      const costUsd = 0.07;
      // Registra consumo + descuenta créditos (medios: sin tokens, costo fijo).
      const credits = await chargeAiUsage(supabase, {
        access: guard.access, companyId, userId: user.id, agentSlug: 'pereskia',
        provider: 'kling', model: 'kling', kind: 'agent_run',
        tokensIn: 0, tokensOut: 0, costUsd,
      });
      return NextResponse.json({ url, credits, costUsd, provider: 'kling' });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'Error con Kling/PiAPI' }, { status: 500 });
    }
  }

  // ── MusicGen vía Replicate — pistas más largas y musicales ─────────────────
  const key = await getIntegrationKey('replicate');
  if (!key) return NextResponse.json({ error: 'Música no configurada. El administrador debe añadir la llave de Replicate.' }, { status: 400 });
  const duration = Math.min(30, Math.max(5, Number(body?.duration) || 12));
  try {
    const cctrl = new AbortController();
    const ctimer = setTimeout(() => cctrl.abort(), 30000);
    let res: Response;
    let pred: any;
    try {
      res = await fetch('https://api.replicate.com/v1/models/meta/musicgen/predictions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'wait' },
        body: JSON.stringify({ input: { prompt, duration, model_version: 'stereo-large', output_format: 'mp3' } }),
        signal: cctrl.signal,
      });
      pred = await res.json();
    } finally { clearTimeout(ctimer); }
    if (!res.ok) return NextResponse.json({ error: pred?.detail || `Replicate error ${res.status}` }, { status: 500 });
    for (let i = 0; i < 20 && (pred.status === 'starting' || pred.status === 'processing'); i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const pctrl = new AbortController();
      const ptimer = setTimeout(() => pctrl.abort(), 30000);
      try {
        const poll = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${key}` }, signal: pctrl.signal });
        pred = await poll.json();
      } finally { clearTimeout(ptimer); }
    }
    if (pred.status !== 'succeeded') return NextResponse.json({ error: pred?.error || 'No se pudo generar la música (intenta de nuevo).' }, { status: 500 });
    const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
    const costUsd = duration * 0.002;
    // Registra consumo + descuenta créditos (medios: sin tokens, costo fijo).
    const credits = await chargeAiUsage(supabase, {
      access: guard.access, companyId, userId: user.id, agentSlug: 'pereskia',
      provider: 'musicgen', model: 'meta/musicgen', kind: 'agent_run',
      tokensIn: 0, tokensOut: 0, costUsd,
    });
    return NextResponse.json({ url, credits, costUsd, provider: 'musicgen' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error generando música' }, { status: 500 });
  }
}
