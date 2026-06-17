import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe/client';
import { PACKS } from '@/lib/cactus/packs';

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }
  const pack = PACKS.find((p) => p.key === body?.pack);
  if (!pack) return NextResponse.json({ error: 'Pack desconocido' }, { status: 400 });

  // Leer el Price ID configurado en el admin (service-role para evitar RLS)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let priceId = '';
  if (url && serviceKey) {
    const admin = createSbClient(url, serviceKey, { auth: { persistSession: false } });
    const { data } = await admin.from('platform_config').select('value').eq('key', `pack_${pack.key}_price_id`).maybeSingle();
    priceId = (data?.value || '').trim();
  }

  if (!priceId) {
    return NextResponse.json({ needsConfig: true, error: 'Este pack aún no tiene Price ID de Stripe configurado en el admin.' }, { status: 409 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/ecosystem?pack=${pack.key}&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/packs`,
      metadata: { user_id: user.id, pack: pack.key },
    });
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error creando checkout' }, { status: 500 });
  }
}
