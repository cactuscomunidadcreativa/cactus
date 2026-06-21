import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateContent, generateImage } from '@/lib/ai';
import { buildAgentSystemPrompt } from '@/lib/cactus/agent-prompts';
import { buildBrandContext } from '@/lib/cactus/brain';
import { estimateCostUsd, usdToCredits } from '@/lib/cactus/credits';
import { getAgent } from '@/lib/cactus/agents-catalog';
import { getAccessStatus, NO_PLAN_REPLY } from '@/lib/cactus/access';
import { isSensitive, deliverableKind, agentTaskPrompt } from '@/lib/cactus/orchestrator-exec';
import { loadOrchestratorState, getTasks } from '@/lib/cactus/orchestrator';
import { getActiveCompanyId, getActiveBrandKit } from '@/lib/cactus/companies';
import { getCompanyPlan, isAgentAvailable, activateAgent, getEffectiveAgentConfig } from '@/lib/cactus/agent-access';
import { checkQuota, registerUsage } from '@/lib/cactus/usage';
import { raiseAlert } from '@/lib/cactus/alerts';
import { retrieveContext } from '@/lib/cactus/rag';
import { runWithSubAgents } from '@/lib/cactus/subagents';
import { recordModelUsage } from '@/lib/cactus/audit';
import { resolveMode, planForMode, hashKey, getCached, setCached } from '@/lib/cactus/resource-engine';
import { getLearnedContext } from '@/lib/cactus/preferences';

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'No disponible en local sin Supabase.' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Gate: no hay plan activo → no se ejecuta nada
  const access = await getAccessStatus(supabase, user);
  if (!access.allowed) {
    return NextResponse.json({ blocked: true, reason: 'no_plan', reply: NO_PLAN_REPLY, upgradeHref: '/packs' });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }
  const projectId: string | undefined = body?.projectId;
  const approveTaskId: string | null = body?.taskId || null;
  if (!projectId) return NextResponse.json({ error: 'Falta el proyecto.' }, { status: 400 });

  // Empresa activa (multiempresa). null si aún no se despliega → comportamiento previo.
  const companyId = await getActiveCompanyId(supabase, user.id);

  // Verifica que el proyecto sea del usuario
  const { data: project } = await supabase
    .from('cactus_projects').select('id, objective').eq('id', projectId).eq('user_id', user.id).maybeSingle();
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 });

  const brand = await getActiveBrandKit(supabase, user.id, companyId);

  const tasks = await getTasks(supabase, projectId);
  const pending = tasks.filter((t) => t.status !== 'done').sort((a, b) => a.order_index - b.order_index);

  // La siguiente tarea en la fila (o la aprobada explícitamente)
  let task = approveTaskId ? tasks.find((t) => t.id === approveTaskId && t.status !== 'done') : pending[0];

  if (!task) {
    const state = await loadOrchestratorState(supabase, user.id, companyId);
    return NextResponse.json({ state, hasMore: false });
  }

  // Pausa híbrida: si la siguiente es sensible y no la estás aprobando, marca review y espera tu OK
  const approvingThis = task.id === approveTaskId;
  if (!approvingThis && isSensitive(task.agent_slug, task.action)) {
    if (task.status !== 'review') {
      await supabase.from('cactus_project_tasks').update({ status: 'review' }).eq('id', task.id);
    }
    const state = await loadOrchestratorState(supabase, user.id, companyId);
    return NextResponse.json({ state, hasMore: true, needsApproval: { taskId: task.id } });
  }

  // ── Cuota del plan (Acción 4): si el mes excede tokens_monthly → 402 ──
  if (companyId && !access.byok) {
    const plan = await getCompanyPlan(supabase, companyId);
    const quota = await checkQuota(supabase, companyId, plan.tokens_monthly);
    if (quota.over) {
      await raiseAlert(supabase, {
        companyId, origin: 'agave', type: 'quota', severity: 'warning',
        title: 'Cuota de tokens del mes alcanzada',
        dedupKey: `quota-${plan.slug}-${quota.limit}`,
        body: `Se usaron ${quota.used.toLocaleString()} de ${quota.limit.toLocaleString()} tokens este mes.`,
      });
      return NextResponse.json({
        blocked: true, reason: 'quota', upgradeHref: '/packs',
        reply: 'Llegaste al tope de tokens de tu plan este mes. Sube de plan o recarga para que el equipo siga. 🌵',
      }, { status: 402 });
    }
  }

  // ── Disponibilidad del agente para la empresa (Acción 3): gate one-shot ──
  const activateMode: 'permanent' | 'one_shot' | null =
    body?.activate === 'permanent' ? 'permanent' : body?.activate === 'one_shot' ? 'one_shot' : null;
  if (companyId) {
    const available = await isAgentAvailable(supabase, companyId, task.agent_slug);
    if (!available) {
      // Auto-activar el agente para que el plan corra sin trabarse (el gasto ya
      // lo controla el sistema de créditos/presupuesto). Antes esto devolvía
      // needsActivation y el bucle se quedaba en 0%.
      try {
        await activateAgent(supabase, { companyId, userId: user.id, slug: task.agent_slug, mode: activateMode || 'one_shot', taskId: task.id });
      } catch { /* si no se puede activar, intentamos ejecutar igual */ }
    }
  }

  // ── Ejecuta la tarea ──
  await supabase.from('cactus_project_tasks').update({ status: 'in_progress', progress: 45 }).eq('id', task.id);
  const agent = getAgent(task.agent_slug);

  try {
    // Cerebro RAG (Fase B): conocimiento scopeado por agente
    const ragContext = await retrieveContext(supabase, {
      companyId, agentSlug: task.agent_slug,
      query: `${task.action} ${project.objective || ''}`.trim(), limit: 5,
    });
    // Aprendizaje (Fase E): preferencias aprendidas del feedback
    const prefsContext = await getLearnedContext(supabase, { companyId, agentSlug: task.agent_slug, userId: user.id });
    // Editor de agentes: persona/modelo/foto editados por la empresa
    const agentCfg = await getEffectiveAgentConfig(supabase, companyId, task.agent_slug);
    const system = buildAgentSystemPrompt(task.agent_slug, buildBrandContext(brand || null), ragContext, prefsContext, agentCfg || undefined);

    // Ejecución v2 (Fase C): modo profundo = sub-agentes acotados (opt-in body.deep)
    const deep = !!body?.deep;
    const kind = deliverableKind(task.agent_slug);
    let content: string, provider: string, model: string, inTok = 0, outTok = 0, subCount = 0, cached = false;
    let imageUrl: string | null = null;
    if (kind === 'image') {
      // Agente visual: genera IMAGEN real (no texto) y la guarda como entregable.
      const imgPrompt = `${task.action}${project.objective ? ` (objetivo: ${project.objective})` : ''}${brand?.name ? ` para la marca ${brand.name}` : ''}. Alta calidad, composición limpia, listo para usar.`;
      const img = await generateImage({ prompt: imgPrompt, size: '1024x1024', quality: 'standard' });
      imageUrl = img.url;
      content = img.revisedPrompt || `Imagen: ${task.action}`;
      provider = 'gpt-image'; model = 'gpt-image';
    } else if (deep) {
      const r = await runWithSubAgents({ system, action: task.action, objective: project.objective || '', max: 3 });
      content = r.content; subCount = r.subCount;
      for (const u of r.usages) { inTok += u.inputTokens || 0; outTok += u.outputTokens || 0; }
      const last = r.usages[r.usages.length - 1];
      provider = last?.provider || 'claude'; model = last?.model || provider;
    } else {
      // Motor de recursos (Fase D): caché de respuestas + nivel por modo de la empresa
      const mode = await resolveMode(supabase, companyId);
      const plan = planForMode(mode);
      const taskPrompt = agentTaskPrompt({ action: task.action, objective: project.objective });
      const cacheKey = hashKey(`${task.agent_slug}|${mode}|${system}|${taskPrompt}`);
      const hit = await getCached(supabase, companyId, cacheKey);
      if (hit) {
        content = hit.content; provider = 'cache'; model = hit.model || 'cache'; cached = true;
      } else {
        const res = await generateContent({
          prompt: taskPrompt, systemPrompt: system,
          provider: (agentCfg?.provider as any) || plan.provider,  // override del editor de agentes
          maxTokens: Math.round(1200 * plan.maxTokensFactor), temperature: 0.7,
        });
        content = res.content; provider = res.provider; model = res.model;
        inTok = res.inputTokens; outTok = res.outputTokens;
        await setCached(supabase, companyId, cacheKey, content, model, task.agent_slug);
      }
    }

    const costUsd = kind === 'image'
      ? estimateCostUsd({ model: 'gpt-image', images: 1 })
      : estimateCostUsd({
          model: provider === 'claude' ? 'claude' : provider === 'gemini' ? 'gemini' : 'gpt',
          inputTokens: inTok, outputTokens: outTok,
        });
    const credits = usdToCredits(costUsd);

    // Consumo (Acción 4): registro atómico por día/empresa/agente/modelo
    await registerUsage(supabase, {
      companyId, userId: user.id, agentSlug: task.agent_slug, model,
      tokensIn: inTok, tokensOut: outTok, costUsd, credits,
    });

    const { data: deliv } = await supabase.from('cactus_deliverables').insert({
      user_id: user.id, project_id: projectId, task_id: task.id, agent_slug: task.agent_slug,
      title: task.action.slice(0, 80), kind, status: 'ready',
      content, url: imageUrl, meta: { credits, model, deep, subCount, cached }, ...(companyId ? { company_id: companyId } : {}),
    }).select('id').single();

    // Auditoría granular (Fase C)
    await recordModelUsage(supabase, {
      companyId, userId: user.id, agentSlug: task.agent_slug, provider, model,
      kind: deep ? 'subagent' : 'agent_run', tokensIn: inTok, tokensOut: outTok, costUsd, credits,
      projectId, taskId: task.id, deliverableId: deliv?.id || null, meta: { deep, subCount, cached },
    });

    await supabase.from('cactus_project_tasks').update({ status: 'done', progress: 100 }).eq('id', task.id);

    // Cobra créditos (salvo byok/super-admin) + ledger de auditoría
    if (!access.byok && access.credits >= 0) {
      const { data: w } = await supabase.from('cactus_credit_wallets').select('balance').eq('user_id', user.id).maybeSingle();
      if (w) {
        await supabase.from('cactus_credit_wallets')
          .update({ balance: Math.max(0, (w.balance || 0) - credits) }).eq('user_id', user.id);
      }
    }
    await supabase.from('cactus_credit_ledger').insert({
      user_id: user.id, delta: -credits, reason: 'agent_run', agent_slug: task.agent_slug, model, cost_usd: costUsd, ...(companyId ? { company_id: companyId } : {}),
    });
  } catch (err: any) {
    await supabase.from('cactus_project_tasks').update({ status: 'pending', progress: 0 }).eq('id', task.id);
    return NextResponse.json({ error: err?.message || `Error ejecutando a ${agent?.name || task.agent_slug}` }, { status: 500 });
  }

  const after = await getTasks(supabase, projectId);
  const hasMore = after.some((t) => t.status !== 'done');

  // Si ya no quedan pendientes, cierra el proyecto
  if (!hasMore) await supabase.from('cactus_projects').update({ status: 'done' }).eq('id', projectId);

  const state = await loadOrchestratorState(supabase, user.id, companyId);
  return NextResponse.json({ state, hasMore });
}
