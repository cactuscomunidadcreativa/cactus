import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSb } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function slugify(s: string) {
  return (s || 'empresa').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'empresa';
}

// POST { name } → crea una empresa para el usuario (bajo su organización) + membresía owner.
export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'No disponible.' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }
  const name = String(body?.name || '').trim();
  if (!name) return NextResponse.json({ ok: false, error: 'Pon un nombre para la empresa.' }, { status: 400 });
  if (name.length > 80) return NextResponse.json({ ok: false, error: 'Nombre demasiado largo.' }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: false, error: 'Servidor sin Storage/credenciales.' }, { status: 500 });
  const admin = createSb(url, key, { auth: { persistSession: false } });

  try {
    // 1) Org del usuario (la suya como dueño). Si no tiene, créala.
    let orgId: string | null = null;
    const { data: org } = await admin.from('organizations').select('id').eq('owner_id', user.id).order('created_at', { ascending: true }).limit(1).maybeSingle();
    orgId = org?.id || null;
    if (!orgId) {
      const { data: prof } = await admin.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      const label = (prof?.full_name || user.email?.split('@')[0] || 'Mi organización').toString();
      const { data: newOrg, error: oErr } = await admin.from('organizations').insert({ owner_id: user.id, name: label }).select('id').single();
      if (oErr) throw oErr;
      orgId = newOrg.id;
    }

    // 2) Plan free por defecto
    const { data: plan } = await admin.from('plans').select('id').eq('slug', 'free').maybeSingle();

    // 3) Empresa (slug único dentro de la org)
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: company, error: cErr } = await admin
      .from('companies').insert({ org_id: orgId, name, slug, plan_id: plan?.id || null }).select('id, name, slug').single();
    if (cErr) throw cErr;

    // 4) Membresía owner
    const { error: mErr } = await admin.from('memberships').insert({ user_id: user.id, company_id: company.id, role: 'owner', status: 'active' });
    if (mErr) throw mErr;

    return NextResponse.json({ ok: true, company });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'No se pudo crear la empresa.' }, { status: 500 });
  }
}
