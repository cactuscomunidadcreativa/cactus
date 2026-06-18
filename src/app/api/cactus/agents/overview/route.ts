import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { listAgentStates } from '@/lib/cactus/agent-access';
import { AGENTS } from '@/lib/cactus/agents-catalog';

// GET → resumen del estado ACTUAL de cada agente para el Centro de Operaciones.
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ agents: AGENTS.map((a) => ({ slug: a.slug, name: a.name, role: a.role, color: a.color, image: a.image, isActive: true, available: true, provider: null, model: null, hasPrompt: false, secrets: 0 })) });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const companyId = await getActiveCompanyId(supabase, user.id);
  const states = await listAgentStates(supabase, companyId, user.id);
  const stateBySlug = new Map(states.map((s) => [s.slug, s]));

  // Config efectiva (global, sobreescrita por empresa)
  const cfg: Record<string, any> = {};
  try {
    const { data } = await supabase.from('agent_configs').select('slug, company_id, image_url, provider, model, prompt, display_name');
    for (const r of (data || []).filter((x: any) => x.company_id === null)) cfg[r.slug] = { ...r };
    for (const r of (data || []).filter((x: any) => x.company_id === companyId)) cfg[r.slug] = { ...(cfg[r.slug] || {}), ...r };
  } catch { /* tabla ausente */ }

  // Conteo de credenciales por agente (empresa)
  const secrets: Record<string, number> = {};
  try {
    if (companyId) {
      const { data } = await supabase.from('agent_secrets').select('agent_slug').eq('company_id', companyId);
      for (const r of (data || [])) secrets[r.agent_slug] = (secrets[r.agent_slug] || 0) + 1;
    }
  } catch { /* noop */ }

  const agents = AGENTS.map((a) => {
    const c = cfg[a.slug] || {};
    const st = stateBySlug.get(a.slug);
    return {
      slug: a.slug,
      name: c.display_name || a.name,
      role: a.role,
      color: a.color,
      image: c.image_url || a.image,
      provider: c.provider || null,
      model: c.model || null,
      hasPrompt: !!(c.prompt && String(c.prompt).trim()),
      isActive: st ? st.isActive : true,
      available: st ? st.available : true,
      secrets: secrets[a.slug] || 0,
    };
  });
  return NextResponse.json({ agents, companyId });
}
