import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { resolveMode } from '@/lib/cactus/resource-engine';
import { canManageCompany } from '@/lib/cactus/rbac';

// GET → modo de IA de la empresa activa (ahorro|equilibrio|calidad).
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ mode: 'equilibrio', canManage: false });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);
  const mode = await resolveMode(supabase, companyId);
  const canManage = await canManageCompany(supabase, user, companyId);
  return NextResponse.json({ mode, canManage });
}

// POST { mode } → cambia el modo (solo owner/admin).
export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);
  if (!companyId) return NextResponse.json({ ok: false, error: 'Sin empresa activa.' }, { status: 400 });
  if (!(await canManageCompany(supabase, user, companyId)))
    return NextResponse.json({ ok: false, error: 'Solo el owner/admin puede cambiar el modo.' }, { status: 403 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }
  const mode = (body?.mode || '').toString();
  if (!['ahorro', 'equilibrio', 'calidad'].includes(mode))
    return NextResponse.json({ ok: false, error: 'Modo inválido.' }, { status: 400 });
  try {
    const { error } = await supabase.from('companies').update({ ai_mode: mode }).eq('id', companyId);
    return NextResponse.json({ ok: !error, error: error?.message });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
