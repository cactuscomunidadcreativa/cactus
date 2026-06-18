import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { canManageCompany } from '@/lib/cactus/rbac';

// GET → dominios + canales de la empresa activa.
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ domains: [], channels: [] });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);
  if (!companyId) return NextResponse.json({ domains: [], channels: [], companyId: null });
  let domains: any[] = [], channels: any[] = [];
  try { const { data } = await supabase.from('domains').select('*').eq('company_id', companyId).order('created_at'); domains = data || []; } catch { /* noop */ }
  try { const { data } = await supabase.from('channels').select('*').eq('company_id', companyId).order('created_at'); channels = data || []; } catch { /* noop */ }
  const canManage = await canManageCompany(supabase, user, companyId);
  return NextResponse.json({ domains, channels, companyId, canManage });
}

// POST { kind: 'domain'|'channel', ... } → agrega.
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
  try {
    if (body?.kind === 'domain') {
      const domain = (body?.domain || '').toString().trim().toLowerCase();
      if (!domain) return NextResponse.json({ ok: false, error: 'Falta el dominio.' }, { status: 400 });
      const { error } = await supabase.from('domains').insert({ company_id: companyId, domain });
      return NextResponse.json({ ok: !error, error: error?.message });
    }
    if (body?.kind === 'channel') {
      const kind = (body?.channelKind || '').toString().trim();
      if (!kind) return NextResponse.json({ ok: false, error: 'Falta el tipo de canal.' }, { status: 400 });
      const { error } = await supabase.from('channels').insert({ company_id: companyId, kind, label: body?.label || kind });
      return NextResponse.json({ ok: !error, error: error?.message });
    }
    return NextResponse.json({ ok: false, error: 'kind inválido.' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}

// DELETE { kind, id } → elimina dominio o canal.
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
  const table = body?.kind === 'domain' ? 'domains' : body?.kind === 'channel' ? 'channels' : null;
  const id = (body?.id || '').toString();
  if (!table || !id) return NextResponse.json({ ok: false, error: 'Datos inválidos.' }, { status: 400 });
  try {
    const { error } = await supabase.from(table).delete().eq('id', id).eq('company_id', companyId);
    return NextResponse.json({ ok: !error });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
