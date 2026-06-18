import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateContent } from '@/lib/ai';
import { buildAgentSystemPrompt } from '@/lib/cactus/agent-prompts';
import { buildBrandContext } from '@/lib/cactus/brain';
import { estimateCostUsd, usdToCredits } from '@/lib/cactus/credits';
import { deliverableKind } from '@/lib/cactus/orchestrator-exec';
import { getActiveCompanyId, getActiveBrandKit } from '@/lib/cactus/companies';
import { retrieveContext } from '@/lib/cactus/rag';
import { registerUsage } from '@/lib/cactus/usage';
import { recordModelUsage } from '@/lib/cactus/audit';
import { recordFeedback, learnFromFeedback } from '@/lib/cactus/preferences';

export const maxDuration = 60;

// POST { deliverableId, feedback? } → regenera el entregable como una NUEVA VERSIÓN.
export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'No disponible.' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 }); }
  const id = (body?.deliverableId || '').toString();
  const feedback = (body?.feedback || '').toString().trim();
  if (!id) return NextResponse.json({ ok: false, error: 'Falta deliverableId.' }, { status: 400 });

  const companyId = await getActiveCompanyId(supabase, user.id);
  const { data: d } = await supabase.from('cactus_deliverables').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!d) return NextResponse.json({ ok: false, error: 'Entregable no encontrado.' }, { status: 404 });

  const { data: project } = await supabase.from('cactus_projects').select('objective').eq('id', d.project_id).maybeSingle();
  const brand = await getActiveBrandKit(supabase, user.id, companyId);

  const slug = d.agent_slug || 'ramona';

  // Aprendizaje (Fase E): el feedback de la corrección se guarda y enseña al agente
  if (feedback) {
    await recordFeedback(supabase, { companyId, userId: user.id, deliverableId: id, agentSlug: slug, rating: 0, comment: feedback });
    await learnFromFeedback(supabase, { companyId, agentSlug: slug, comment: feedback, rating: -1 });
  }

  const ragContext = await retrieveContext(supabase, { companyId, agentSlug: slug, query: `${d.title} ${project?.objective || ''}`, limit: 5 });
  const system = buildAgentSystemPrompt(slug, buildBrandContext(brand || null), ragContext);
  const prompt = `Mejora y regenera este entregable${feedback ? ` según el feedback del cliente: "${feedback}"` : ', elevando su calidad'}.\n\nTÍTULO: ${d.title}\n\nVERSIÓN ACTUAL:\n${d.content || ''}`;

  let res;
  try {
    res = await generateContent({ prompt, systemPrompt: system, maxTokens: 1500, temperature: 0.7 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error regenerando' }, { status: 500 });
  }

  const costUsd = estimateCostUsd({
    model: res.provider === 'claude' ? 'claude' : res.provider === 'gemini' ? 'gemini' : 'gpt',
    inputTokens: res.inputTokens, outputTokens: res.outputTokens,
  });
  const credits = usdToCredits(costUsd);
  const root = d.version_of || d.id;

  // Versiones previas dejan de ser "la última"
  await supabase.from('cactus_deliverables').update({ is_latest: false }).or(`id.eq.${root},version_of.eq.${root}`);

  const { data: created } = await supabase.from('cactus_deliverables').insert({
    user_id: user.id, project_id: d.project_id, task_id: d.task_id, agent_slug: slug,
    title: d.title, kind: d.kind || deliverableKind(slug), status: 'ready',
    content: res.content, version: (d.version || 1) + 1, version_of: root, is_latest: true,
    meta: { credits, model: res.model, regenerated: true, ...(feedback ? { feedback } : {}) },
    ...(companyId ? { company_id: companyId } : {}),
  }).select('id, version').single();

  await registerUsage(supabase, { companyId, userId: user.id, agentSlug: slug, model: res.model, tokensIn: res.inputTokens, tokensOut: res.outputTokens, costUsd, credits });
  await recordModelUsage(supabase, {
    companyId, userId: user.id, agentSlug: slug, provider: res.provider, model: res.model, kind: 'agent_run',
    tokensIn: res.inputTokens, tokensOut: res.outputTokens, costUsd, credits,
    projectId: d.project_id, taskId: d.task_id, deliverableId: created?.id || null, meta: { regenerated: true },
  });
  await supabase.from('cactus_credit_ledger').insert({
    user_id: user.id, delta: -credits, reason: 'regenerate', agent_slug: slug, model: res.model, cost_usd: costUsd, ...(companyId ? { company_id: companyId } : {}),
  });

  return NextResponse.json({ ok: true, id: created?.id, version: created?.version });
}
