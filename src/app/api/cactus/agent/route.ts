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
import { retrieveViaRamona } from '@/lib/cactus/ramona-context';
import type { AIChatMessage } from '@/lib/ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  let brand = null;
  let companyId: string | null = null;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    companyId = await getActiveCompanyId(supabase, user.id);
    brand = await getActiveBrandKit(supabase, user.id, companyId);
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }
  const { slug, messages, maxTokens, subAgent } = body || {};
  if (!slug || !getAgent(slug)) return NextResponse.json({ error: 'Agente desconocido' }, { status: 400 });
  if (!Array.isArray(messages) || messages.length === 0) return NextResponse.json({ error: 'Faltan mensajes' }, { status: 400 });

  // Tokens de salida: 2000 por defecto; configurable hasta 4000 (p. ej. contenido largo de Pitaya).
  const tokenCap = Math.min(4000, Math.max(256, Number(maxTokens) || 2000));

  // Profundidad del Cerebro vía Ramona (Cerebro paso 2): recupera contexto
  // profundo y validado para la última consulta del usuario. Fail-safe -> ''.
  const lastUser = [...(messages as AIChatMessage[])].reverse().find((m) => m.role === 'user')?.content || '';
  const ragContext = supabase ? await retrieveViaRamona(supabase, { companyId, agentSlug: slug, query: lastUser }) : '';

  // Sub-agente especializado (Bloque 6) + automatizaciones activas (Bloque 7):
  // ambos reorientan el system prompt del agente.
  const systemPrompt = buildAgentSystemPrompt(slug, buildBrandContext(brand), ragContext)
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
    console.error('[cactus/agent] error:', slug, err?.message || err);
    const raw = String(err?.message || '');
    // Mensaje amigable; no filtra detalles crudos del proveedor al cliente.
    const friendly = /not.?found|404|model/i.test(raw)
      ? 'El modelo de IA no está disponible ahora mismo. Intenta de nuevo o cambia el presupuesto en Ajustes.'
      : /api key|configured|unauthorized|401/i.test(raw)
        ? 'La IA no está configurada. Avísale al administrador.'
        : 'El agente tuvo un problema al responder. Intenta de nuevo.';
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
