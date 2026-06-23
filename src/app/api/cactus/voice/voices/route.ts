import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getIntegrationKey } from '@/lib/ai/config';
import { companyKey } from '@/lib/cactus/provider-keys';

export const dynamic = 'force-dynamic';

// Lista de voces de ElevenLabs (incluye las clonadas por el usuario).
export async function GET() {
  // Fail-closed: sin Supabase NO se atiende. Solo lista voces (no factura), por
  // eso conserva la forma {enabled,voices} para que la UI degrade con gracia.
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ enabled: false, voices: [] }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ enabled: false, voices: [] }, { status: 401 });
  const key = (await companyKey('elevenlabs')) || (await getIntegrationKey('elevenlabs'));
  if (!key) return NextResponse.json({ enabled: false, voices: [] });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': key }, signal: ctrl.signal });
    if (!res.ok) return NextResponse.json({ enabled: true, voices: [] });
    const data = await res.json();
    const voices = (data?.voices || []).map((v: any) => ({
      id: v.voice_id, name: v.name, cloned: v.category === 'cloned' || v.category === 'professional',
    }));
    return NextResponse.json({ enabled: true, voices });
  } catch {
    return NextResponse.json({ enabled: true, voices: [] });
  } finally {
    clearTimeout(timer);
  }
}
