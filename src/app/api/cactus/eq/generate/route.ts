import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAngles } from '@/lib/eq/generate';
import type { ProfileKey } from '@/lib/eq/profiles';

export const maxDuration = 60;

export async function POST(req: Request) {
  // Auth: cualquier usuario autenticado. En dev (sin Supabase) se permite.
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const { brand, objective, channel, profiles } = body || {};
  if (!brand?.brandName || !brand?.offer || !brand?.brief) {
    return NextResponse.json({ error: 'Faltan datos de marca (brandName, offer, brief).' }, { status: 400 });
  }

  try {
    const result = await generateAngles({
      brand,
      objective: objective || 'deseo',
      channel: channel || 'instagram',
      profiles: (profiles as ProfileKey[]) || [],
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error generando' }, { status: 500 });
  }
}
