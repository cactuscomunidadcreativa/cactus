import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAPIKey, getIntegrationKey } from '@/lib/ai/config';
import { usdToCredits } from '@/lib/cactus/credits';

export const maxDuration = 60;

const OPENAI_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

export async function POST(req: Request) {
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }
  const text = (body?.text || '').trim();
  if (!text) return NextResponse.json({ error: 'Escribe el texto a locutar.' }, { status: 400 });
  if (text.length > 4000) return NextResponse.json({ error: 'Máximo 4000 caracteres.' }, { status: 400 });

  // ── ElevenLabs (voces premium + clonadas) si hay voiceId + key ─────────────
  const elevenKey = await getIntegrationKey('elevenlabs');
  const voiceId = typeof body?.voiceId === 'string' ? body.voiceId.trim() : '';
  if (elevenKey && voiceId) {
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: { 'xi-api-key': elevenKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
      });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: `ElevenLabs error ${res.status}: ${err.slice(0, 200)}` }, { status: 500 });
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const audio = `data:audio/mp3;base64,${buf.toString('base64')}`;
      const costUsd = (text.length / 1000) * 0.30 * 0.1; // estimación ElevenLabs por caracteres
      return NextResponse.json({ audio, credits: usdToCredits(costUsd), costUsd, provider: 'elevenlabs', voiceId });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'Error con ElevenLabs' }, { status: 500 });
    }
  }

  // ── OpenAI TTS (voces fijas) — respaldo ────────────────────────────────────
  const voice = OPENAI_VOICES.includes(body?.voice) ? body.voice : 'nova';
  const apiKey = await getAPIKey('openai');
  if (!apiKey) return NextResponse.json({ error: 'Voz no configurada. Añade ElevenLabs u OpenAI en Conexiones.' }, { status: 500 });

  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'tts-1', voice, input: text, response_format: 'mp3' }),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `TTS error ${res.status}: ${err}` }, { status: 500 });
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const audio = `data:audio/mp3;base64,${buf.toString('base64')}`;
    const costUsd = (text.length / 1000) * 0.015; // tts-1 ~ $0.015 / 1k chars
    return NextResponse.json({ audio, credits: usdToCredits(costUsd), costUsd, provider: 'openai', voice });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error generando audio' }, { status: 500 });
  }
}
