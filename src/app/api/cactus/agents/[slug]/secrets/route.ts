import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { canManageCompany } from '@/lib/cactus/rbac';
import { getAgent } from '@/lib/cactus/agents-catalog';
import { listAgentSecrets, addAgentSecret, deleteAgentSecret, secretsConfigured } from '@/lib/cactus/secrets';

export const runtime = 'nodejs'; // crypto

// GET → metadatos de secretos (sin valores) + si el servidor tiene llave + canManage.
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  if (!getAgent(params.slug)) return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ secrets: [], configured: secretsConfigured(), canManage: false });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);
  const secrets = await listAgentSecrets(supabase, companyId, params.slug);
  const canManage = await canManageCompany(supabase, user, companyId);
  return NextResponse.json({ secrets, configured: secretsConfigured(), canManage });
}

// POST { name, kind, value } → guarda cifrado (solo owner/admin).
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  if (!getAgent(params.slug)) return NextResponse.json({ ok: false, error: 'Agente no encontrado' }, { status: 404 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);
  if (!companyId) return NextResponse.json({ ok: false, error: 'Sin empresa activa.' }, { status: 400 });
  if (!(await canManageCompany(supabase, user, companyId)))
    return NextResponse.json({ ok: false, error: 'Solo el owner/admin puede gestionar credenciales.' }, { status: 403 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }
  const r = await addAgentSecret(supabase, companyId, params.slug, {
    name: (body?.name || '').toString().trim(),
    kind: (body?.kind || 'token').toString(),
    value: (body?.value || '').toString(),
  });
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}

// DELETE { id } → elimina un secreto (solo owner/admin).
export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);
  if (!companyId) return NextResponse.json({ ok: false, error: 'Sin empresa activa.' }, { status: 400 });
  if (!(await canManageCompany(supabase, user, companyId)))
    return NextResponse.json({ ok: false, error: 'Solo el owner/admin puede gestionar credenciales.' }, { status: 403 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }
  const ok = await deleteAgentSecret(supabase, companyId, params.slug, (body?.id || '').toString());
  return NextResponse.json({ ok });
}
