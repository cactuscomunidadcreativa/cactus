import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAPIKey, getIntegrationKey } from '@/lib/ai/config';
import { companyKey } from '@/lib/cactus/provider-keys';
import { guardAiAccess, chargeAiUsage } from '@/lib/cactus/ai-guard';
import { getActiveCompanyId } from '@/lib/cactus/companies';

export const maxDuration = 60;

const OPENAI_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

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
  const text = (body?.text || '').trim();
  if (!text) return NextResponse.json({ error: 'Escribe el texto a locutar.' }, { status: 400 });
  if (text.length > 4000) return NextResponse.json({ error: 'Máximo 4000 caracteres.' }, { status: 400 });

  // Gate de acceso + cuota mensual ANTES de gastar IA (cierra la fuga de IA gratis).
  const guard = await guardAiAccess(supabase, user, companyId);
  if (!guard.ok) return guard.response;

  // ── ElevenLabs (voces premium + clonadas) si hay voiceId + key ─────────────
  const elevenKey = (await companyKey('elevenlabs')) || (await getIntegrationKey('elevenlabs'));
  const voiceId = typeof body?.voiceId === 'string' ? body.voiceId.trim() : '';
  if (elevenKey && voiceId) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: { 'xi-api-key': elevenKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: `ElevenLabs error ${res.status}: ${err.slice(0, 200)}` }, { status: 500 });
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const audio = `data:audio/mp3;base64,${buf.toString('base64')}`;
      const costUsd = (text.length / 1000) * 0.30 * 0.1; // estimación ElevenLabs por caracteres
      // Registra consumo + descuenta créditos (medios: sin tokens, costo fijo).
      const credits = await chargeAiUsage(supabase, {
        access: guard.access, companyId, userId: user.id, agentSlug: 'garambullo',
        provider: 'elevenlabs', model: 'eleven_multilingual_v2', kind: 'agent_run',
        tokensIn: 0, tokensOut: 0, costUsd,
      });
      return NextResponse.json({ audio, credits, costUsd, provider: 'elevenlabs', voiceId });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'Error con ElevenLabs' }, { status: 500 });
    } finally {
      clearTimeout(timer);
    }
  }

  // ── OpenAI TTS (voces fijas) — respaldo ────────────────────────────────────
  const voice = OPENAI_VOICES.includes(body?.voice) ? body.voice : 'nova';
  const apiKey = await getAPIKey('openai');
  if (!apiKey) return NextResponse.json({ error: 'Voz no configurada. Añade ElevenLabs u OpenAI en Conexiones.' }, { status: 500 });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'tts-1', voice, input: text, response_format: 'mp3' }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `TTS error ${res.status}: ${err}` }, { status: 500 });
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const audio = `data:audio/mp3;base64,${buf.toString('base64')}`;
    const costUsd = (text.length / 1000) * 0.015; // tts-1 ~ $0.015 / 1k chars
    // Registra consumo + descuenta créditos (medios: sin tokens, costo fijo).
    const credits = await chargeAiUsage(supabase, {
      access: guard.access, companyId, userId: user.id, agentSlug: 'garambullo',
      provider: 'openai', model: 'tts-1', kind: 'agent_run',
      tokensIn: 0, tokensOut: 0, costUsd,
    });
    return NextResponse.json({ audio, credits, costUsd, provider: 'openai', voice });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error generando audio' }, { status: 500 });
  } finally {
    clearTimeout(timer);
  }
}
