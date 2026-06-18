import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { getAgentConfigRow, saveAgentConfig } from '@/lib/cactus/agent-access';
import { canManageCompany } from '@/lib/cactus/rbac';
import { isSuperAdmin } from '@/lib/admin/auth';
import { getAgent } from '@/lib/cactus/agents-catalog';

const EDITABLE = ['display_name', 'description', 'image_url', 'video_url', 'provider', 'model', 'prompt', 'custom_instructions', 'culture_prompt', 'company_tone', 'company_values', 'industry_context', 'is_active'];

function defaults(agent: any) {
  return { slug: agent.slug, name: agent.name, role: agent.role, description: agent.description, image: agent.image, color: agent.color };
}

// GET ?scope=company|global → defaults + config del nivel pedido + canManage + isSuper.
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const agent = getAgent(params.slug);
  if (!agent) return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });
  const scope = new URL(req.url).searchParams.get('scope') === 'global' ? 'global' : 'company';
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ defaults: defaults(agent), config: null, canManage: false, isSuper: false, scope });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);
  const isSuper = isSuperAdmin(user.email);
  const config = await getAgentConfigRow(supabase, scope === 'global' ? null : companyId, params.slug);
  const canManage = scope === 'global' ? isSuper : await canManageCompany(supabase, user, companyId);
  return NextResponse.json({ defaults: defaults(agent), config, canManage, isSuper, scope });
}

// PUT { scope?, ...fields } → guarda en el nivel pedido (global = solo super-admin).
export async function PUT(req: Request, { params }: { params: { slug: string } }) {
  if (!getAgent(params.slug)) return NextResponse.json({ ok: false, error: 'Agente no encontrado' }, { status: 404 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }
  const scope = body?.scope === 'global' ? 'global' : 'company';
  const fields: any = {};
  for (const k of EDITABLE) if (k in body) fields[k] = body[k] === '' ? null : body[k];

  if (scope === 'global') {
    if (!isSuperAdmin(user.email)) return NextResponse.json({ ok: false, error: 'Solo Cactus (super-admin) edita el nivel global.' }, { status: 403 });
    const ok = await saveAgentConfig(supabase, null, params.slug, fields);
    return NextResponse.json({ ok });
  }
  const companyId = await getActiveCompanyId(supabase, user.id);
  if (!companyId) return NextResponse.json({ ok: false, error: 'Sin empresa activa.' }, { status: 400 });
  if (!(await canManageCompany(supabase, user, companyId)))
    return NextResponse.json({ ok: false, error: 'Solo el owner/admin puede editar agentes.' }, { status: 403 });
  const ok = await saveAgentConfig(supabase, companyId, params.slug, fields);
  return NextResponse.json({ ok });
}
