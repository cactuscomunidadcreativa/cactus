import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { getAgentConfig, saveAgentConfig } from '@/lib/cactus/agent-access';
import { canManageCompany } from '@/lib/cactus/rbac';
import { getAgent } from '@/lib/cactus/agents-catalog';

const EDITABLE = ['display_name', 'description', 'image_url', 'provider', 'model', 'prompt', 'custom_instructions', 'culture_prompt', 'company_tone', 'company_values', 'industry_context', 'is_active'];

function defaults(agent: any) {
  return { slug: agent.slug, name: agent.name, role: agent.role, description: agent.description, image: agent.image, color: agent.color };
}

// GET → defaults del catálogo + override de la empresa (config) + canManage.
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const agent = getAgent(params.slug);
  if (!agent) return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ defaults: defaults(agent), config: null, canManage: false });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);
  const config = await getAgentConfig(supabase, companyId, params.slug);
  const canManage = await canManageCompany(supabase, user, companyId);
  return NextResponse.json({ defaults: defaults(agent), config, canManage });
}

// PUT → guarda la personalización del agente para la empresa (solo owner/admin).
export async function PUT(req: Request, { params }: { params: { slug: string } }) {
  if (!getAgent(params.slug)) return NextResponse.json({ ok: false, error: 'Agente no encontrado' }, { status: 404 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);
  if (!companyId) return NextResponse.json({ ok: false, error: 'Sin empresa activa.' }, { status: 400 });
  if (!(await canManageCompany(supabase, user, companyId)))
    return NextResponse.json({ ok: false, error: 'Solo el owner/admin puede editar agentes.' }, { status: 403 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }
  const fields: any = {};
  for (const k of EDITABLE) if (k in body) fields[k] = body[k] === '' ? null : body[k];
  const ok = await saveAgentConfig(supabase, companyId, params.slug, fields);
  return NextResponse.json({ ok });
}
