import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateChat } from '@/lib/ai';
import { buildAgentSystemPrompt } from '@/lib/cactus/agent-prompts';
import { buildBrandContext } from '@/lib/cactus/brain';
import { estimateCostUsd, usdToCredits } from '@/lib/cactus/credits';
import { getAgent } from '@/lib/cactus/agents-catalog';
import { getActiveCompanyId, getActiveBrandKit } from '@/lib/cactus/companies';
import { getBudgetTier } from '@/lib/cactus/budget-server';
import { subAgentDirective } from '@/lib/cactus/sub-agents';
import { getAutomationDirectives } from '@/lib/cactus/automations-server';
import type { AIChatMessage } from '@/lib/ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  let brand = null;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = await getActiveCompanyId(supabase, user.id);
    brand = await getActiveBrandKit(supabase, user.id, companyId);
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }
  const { slug, messages, maxTokens, subAgent } = body || {};
  if (!slug || !getAgent(slug)) return NextResponse.json({ error: 'Agente desconocido' }, { status: 400 });
  if (!Array.isArray(messages) || messages.length === 0) return NextResponse.json({ error: 'Faltan mensajes' }, { status: 400 });

  // Tokens de salida: 2000 por defecto; configurable hasta 4000 (p. ej. contenido largo de Pitaya).
  const tokenCap = Math.min(4000, Math.max(256, Number(maxTokens) || 2000));

  // Sub-agente especializado (Bloque 6) + automatizaciones activas (Bloque 7):
  // ambos reorientan el system prompt del agente.
  const systemPrompt = buildAgentSystemPrompt(slug, buildBrandContext(brand))
    + subAgentDirective(slug, typeof subAgent === 'string' ? subAgent : null)
    + await getAutomationDirectives(slug);
  const tier = await getBudgetTier();

  try {
    const res = await generateChat({
      messages: messages as AIChatMessage[],
      systemPrompt,
      tier,
      maxTokens: tokenCap,
      temperature: 0.7,
    });
    const costUsd = estimateCostUsd({
      model: res.provider === 'claude' ? 'claude' : res.provider === 'gemini' ? 'gemini' : 'gpt',
      inputTokens: res.inputTokens, outputTokens: res.outputTokens,
    });
    return NextResponse.json({ content: res.content, credits: usdToCredits(costUsd), costUsd, model: res.model });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error del agente' }, { status: 500 });
  }
}
