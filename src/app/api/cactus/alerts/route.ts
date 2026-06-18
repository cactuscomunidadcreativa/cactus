import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { listAlerts, setAlertStatus, type AlertStatus } from '@/lib/cactus/alerts';

// GET → feed de alertas de la empresa activa.
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ alerts: [] });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);
  const alerts = await listAlerts(supabase, companyId);
  return NextResponse.json({ alerts, companyId });
}

// PATCH { id, status } → ack / resolve / dismiss.
export async function PATCH(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);
  if (!companyId) return NextResponse.json({ ok: false, error: 'Sin empresa activa.' }, { status: 400 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }
  const id = (body?.id || '').toString();
  const status = (body?.status || '').toString() as AlertStatus;
  if (!id || !['open', 'ack', 'resolved', 'dismissed'].includes(status))
    return NextResponse.json({ ok: false, error: 'Datos inválidos.' }, { status: 400 });
  const ok = await setAlertStatus(supabase, companyId, id, status);
  return NextResponse.json({ ok });
}
