import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { listAgentStates, setAgentActive } from '@/lib/cactus/agent-access';
import { canManageCompany } from '@/lib/cactus/rbac';

// GET → estado on/off de todos los agentes para la empresa activa.
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ states: [], companyId: null });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);
  const states = await listAgentStates(supabase, companyId, user.id);
  const canManage = await canManageCompany(supabase, user, companyId);
  return NextResponse.json({ states, companyId, canManage });
}

// POST { slug, isActive } → enciende/apaga un agente (solo owner/admin).
export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'No disponible.' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);
  if (!companyId) return NextResponse.json({ ok: false, error: 'Sin empresa activa.' }, { status: 400 });
  if (!(await canManageCompany(supabase, user, companyId)))
    return NextResponse.json({ ok: false, error: 'Solo el owner/admin puede cambiar agentes.' }, { status: 403 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }
  const slug = (body?.slug || '').toString();
  if (!slug) return NextResponse.json({ ok: false, error: 'Falta slug.' }, { status: 400 });
  const ok = await setAgentActive(supabase, companyId, slug, !!body?.isActive);
  return NextResponse.json({ ok });
}
