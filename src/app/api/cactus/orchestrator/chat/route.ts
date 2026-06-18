import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateChat, type AIChatMessage } from '@/lib/ai';
import { planFromGoal } from '@/lib/cactus/ramona';
import { buildBrandContext } from '@/lib/cactus/brain';
import { estimateCostUsd, usdToCredits } from '@/lib/cactus/credits';
import { getAccessStatus, NO_PLAN_REPLY } from '@/lib/cactus/access';
import { loadOrchestratorState, getTasks, getMessages } from '@/lib/cactus/orchestrator';
import { getActiveCompanyId } from '@/lib/cactus/companies';

export const maxDuration = 60;

const RAMONA_CHAT_SYSTEM = `Eres Ramona, la Coordinadora General de Cactus Comunidad Creativa.
Hablas en español, cálida, concreta y ejecutiva. Coordinas a un equipo de agentes-cactus
para lograr los objetivos del usuario. Responde breve (2-4 frases), con foco en próximos pasos.`;

export async function POST(req: Request) {
  const supabase = await createClient();

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }
  const message: string = (body?.message || '').toString().trim();
  const newProject: boolean = !!body?.newProject;
  if (!message) return NextResponse.json({ error: 'Falta el mensaje.' }, { status: 400 });

  // ── Dev sin Supabase: orquesta en memoria (sin persistir) ──
  if (!supabase) {
    const plan = await planFromGoal({ goal: message, brand: null });
    return NextResponse.json({
      ephemeral: true,
      reply: plan.summary || 'Voy a coordinar a los agentes para esto.',
      plan,
    });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // ── Gate: plan activo (suscripción O créditos). Si no, Ramona no trabaja. ──
  const access = await getAccessStatus(supabase, user);
  if (!access.allowed) {
    return NextResponse.json({ blocked: true, reason: 'no_plan', reply: NO_PLAN_REPLY, upgradeHref: '/packs' });
  }

  // Empresa activa (multiempresa). null si aún no se despliega → comportamiento previo.
  const companyId = await getActiveCompanyId(supabase, user.id);

  // Marca activa para contexto
  const { data: brand } = await supabase
    .from('cactus_brand_kits')
    .select('*').eq('user_id', user.id).eq('is_active', true)
    .order('updated_at', { ascending: false }).limit(1).maybeSingle();

  // ── Resolver proyecto activo (o crear uno) ──
  let projectId: string | null = body?.projectId || null;
  if (!projectId && !newProject) {
    let aq = supabase
      .from('cactus_projects')
      .select('id').eq('user_id', user.id).eq('is_active', true);
    if (companyId) aq = aq.eq('company_id', companyId);
    const { data: active } = await aq
      .order('updated_at', { ascending: false }).limit(1).maybeSingle();
    projectId = active?.id || null;
  }

  if (!projectId) {
    // Desactiva el proyecto activo previo (de esta empresa) y crea uno nuevo
    let dq = supabase.from('cactus_projects').update({ is_active: false }).eq('user_id', user.id).eq('is_active', true);
    if (companyId) dq = dq.eq('company_id', companyId);
    await dq;
    const { data: created, error } = await supabase
      .from('cactus_projects')
      .insert({ user_id: user.id, name: message.slice(0, 60), objective: message, status: 'active', is_active: true, brand_kit_id: brand?.id || null, ...(companyId ? { company_id: companyId } : {}) })
      .select('id').single();
    if (error || !created) return NextResponse.json({ error: 'No se pudo crear el proyecto. ¿Aplicaste la migración 033?' }, { status: 500 });
    projectId = created.id;
  }

  if (!projectId) return NextResponse.json({ error: 'No se pudo resolver el proyecto.' }, { status: 500 });

  // Persiste el mensaje del usuario
  await supabase.from('cactus_project_messages').insert({ user_id: user.id, project_id: projectId, role: 'user', content: message, ...(companyId ? { company_id: companyId } : {}) });

  // ¿Ya hay tareas? Si no, Ramona arma el plan y lo persiste.
  const existingTasks = await getTasks(supabase, projectId);

  try {
    if (existingTasks.length === 0) {
      const plan = await planFromGoal({ goal: message, brand: brand || null });

      if (plan.steps.length) {
        await supabase.from('cactus_project_tasks').insert(
          plan.steps.map((s, i) => ({
            user_id: user.id, project_id: projectId, agent_slug: s.agentSlug,
            action: s.action, status: 'pending', progress: 0, order_index: i,
            ...(companyId ? { company_id: companyId } : {}),
          }))
        );
      }
      // Afina nombre/resumen del proyecto con la intención del plan
      await supabase.from('cactus_projects')
        .update({ name: plan.intent || message.slice(0, 60), summary: plan.summary || null })
        .eq('id', projectId);

      const reply = plan.summary
        ? `¡Perfecto! ${plan.summary} Voy a coordinar a ${plan.steps.length} agente${plan.steps.length === 1 ? '' : 's'} para lograrlo.`
        : 'Voy a coordinar a los agentes adecuados para esto.';

      await supabase.from('cactus_project_messages')
        .insert({ user_id: user.id, project_id: projectId, role: 'assistant', content: reply, plan, ...(companyId ? { company_id: companyId } : {}) });
    } else {
      // Seguimiento conversacional con historial
      const history = await getMessages(supabase, projectId);
      const messages: AIChatMessage[] = history.map((m) => ({ role: m.role, content: m.content }));
      const system = `${RAMONA_CHAT_SYSTEM}\n\n${buildBrandContext(brand || null) || ''}`;

      const res = await generateChat({ messages, systemPrompt: system, maxTokens: 800, temperature: 0.7 });
      const credits = usdToCredits(estimateCostUsd({
        model: res.provider === 'claude' ? 'claude' : res.provider === 'gemini' ? 'gemini' : 'gpt',
        inputTokens: res.inputTokens, outputTokens: res.outputTokens,
      }));

      await supabase.from('cactus_project_messages')
        .insert({ user_id: user.id, project_id: projectId, role: 'assistant', content: res.content, credits, ...(companyId ? { company_id: companyId } : {}) });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error coordinando' }, { status: 500 });
  }

  // Devuelve el estado completo actualizado
  const state = await loadOrchestratorState(supabase, user.id, companyId);
  return NextResponse.json({ state });
}
