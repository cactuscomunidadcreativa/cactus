import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { planFromGoal } from '@/lib/cactus/ramona';

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  let brand = null;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // intentar cargar la marca activa (si la tabla existe)
    const { data } = await supabase
      .from('cactus_brand_kits')
      .select('*').eq('user_id', user.id).eq('is_active', true)
      .order('updated_at', { ascending: false }).limit(1).maybeSingle();
    brand = data || null;
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }
  if (!body?.goal) return NextResponse.json({ error: 'Falta el objetivo.' }, { status: 400 });

  try {
    const plan = await planFromGoal({ goal: body.goal, brand });
    return NextResponse.json({ plan });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error armando el plan' }, { status: 500 });
  }
}
