import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getIntegrationKey } from '@/lib/ai/config';

export const dynamic = 'force-dynamic';

// Lista de voces de ElevenLabs (incluye las clonadas por el usuario).
export async function GET() {
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ enabled: false, voices: [] });
  }
  const key = await getIntegrationKey('elevenlabs');
  if (!key) return NextResponse.json({ enabled: false, voices: [] });

  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': key } });
    if (!res.ok) return NextResponse.json({ enabled: true, voices: [] });
    const data = await res.json();
    const voices = (data?.voices || []).map((v: any) => ({
      id: v.voice_id, name: v.name, cloned: v.category === 'cloned' || v.category === 'professional',
    }));
    return NextResponse.json({ enabled: true, voices });
  } catch {
    return NextResponse.json({ enabled: true, voices: [] });
  }
}
