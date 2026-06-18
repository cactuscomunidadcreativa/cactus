import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { setActiveCompany } from '@/lib/cactus/companies';

// POST { companyId } → fija la empresa activa del usuario (profiles.primary_company_id).
export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'No disponible sin Supabase.' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }
  const companyId: string = (body?.companyId || '').toString();
  if (!companyId) return NextResponse.json({ ok: false, error: 'Falta companyId.' }, { status: 400 });

  const ok = await setActiveCompany(supabase, user.id, companyId);
  if (!ok) return NextResponse.json({ ok: false, error: 'No se pudo cambiar de empresa.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
