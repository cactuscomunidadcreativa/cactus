import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: brand kit activo del usuario (o null)
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ brand: null });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('cactus_brand_kits')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // Tabla aún no creada (migración 031 pendiente) → degradar elegante
    return NextResponse.json({ brand: null, pendingSchema: true });
  }
  return NextResponse.json({ brand: data || null });
}

// POST: crea/actualiza el brand kit del usuario
export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }
  if (!body?.name) return NextResponse.json({ error: 'El nombre de marca es obligatorio.' }, { status: 400 });

  const row = {
    id: body.id || undefined,
    user_id: user.id,
    name: body.name,
    industry: body.industry || null,
    offer: body.offer || null,
    audience: body.audience || null,
    tone: body.tone || null,
    values: Array.isArray(body.values) ? body.values : [],
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('cactus_brand_kits')
    .upsert(row, { onConflict: 'id' })
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: 'No se pudo guardar. ¿Ya aplicaste la migración 031 (tabla cactus_brand_kits)?', detail: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ brand: data });
}
