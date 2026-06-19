import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getIntegrationKey } from '@/lib/ai/config';

export const maxDuration = 60;

// Clona una voz en ElevenLabs a partir de muestras de audio subidas por el usuario.
export async function POST(req: Request) {
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const key = await getIntegrationKey('elevenlabs');
  if (!key) return NextResponse.json({ error: 'Clonación no disponible: configura ElevenLabs en Conexiones.' }, { status: 400 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }
  const name = String(form.get('name') || '').trim();
  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (!name) return NextResponse.json({ error: 'Ponle un nombre a tu voz.' }, { status: 400 });
  if (files.length === 0) return NextResponse.json({ error: 'Sube al menos una muestra de audio (ideal 1-3 min, voz clara).' }, { status: 400 });

  try {
    const out = new FormData();
    out.append('name', name);
    out.append('description', `Voz clonada en Cactus: ${name}`);
    for (const f of files) out.append('files', f, f.name || 'sample.mp3');

    const res = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST', headers: { 'xi-api-key': key }, body: out,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.detail?.message || `ElevenLabs error ${res.status}` }, { status: 500 });
    return NextResponse.json({ voiceId: data.voice_id, name });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'No se pudo clonar la voz.' }, { status: 500 });
  }
}
