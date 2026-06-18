import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { canManageCompany } from '@/lib/cactus/rbac';
import { listIntegrationStatus, connectApiKey, disconnectIntegration, secretsConfigured } from '@/lib/cactus/integration-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET → estado de conexión de cada integración para la empresa activa.
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ status: {}, canManage: false, secretsConfigured: false });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);
  const status = await listIntegrationStatus(supabase, companyId);
  const canManage = companyId ? await canManageCompany(supabase, user, companyId) : false;
  return NextResponse.json({ status, companyId, canManage, secretsConfigured: secretsConfigured() });
}

// POST { slug, values } → conecta un proveedor por API key (cifrada).
export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);
  if (!companyId) return NextResponse.json({ ok: false, error: 'Sin empresa activa.' }, { status: 400 });
  if (!(await canManageCompany(supabase, user, companyId)))
    return NextResponse.json({ ok: false, error: 'Solo el owner/admin puede gestionar conexiones.' }, { status: 403 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }
  const slug = (body?.slug || '').toString();
  const values = (body?.values && typeof body.values === 'object') ? body.values : {};
  const r = await connectApiKey(supabase, companyId, slug, values);
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}

// DELETE { slug } → desconecta un proveedor.
export async function DELETE(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);
  if (!companyId) return NextResponse.json({ ok: false, error: 'Sin empresa activa.' }, { status: 400 });
  if (!(await canManageCompany(supabase, user, companyId)))
    return NextResponse.json({ ok: false, error: 'Solo el owner/admin puede gestionar conexiones.' }, { status: 403 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }
  const slug = (body?.slug || '').toString();
  if (!slug) return NextResponse.json({ ok: false, error: 'Falta slug.' }, { status: 400 });
  const ok = await disconnectIntegration(supabase, companyId, slug);
  return NextResponse.json({ ok });
}
