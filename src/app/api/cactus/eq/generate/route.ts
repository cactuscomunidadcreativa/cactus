import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAngles } from '@/lib/eq/generate';
import { getBudgetTier } from '@/lib/cactus/budget-server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { guardAiAccess, chargeAiUsage } from '@/lib/cactus/ai-guard';
import type { ProfileKey } from '@/lib/eq/profiles';

export const maxDuration = 60;

export async function POST(req: Request) {
  // Fail-closed: sin Supabase NO se atiende (antes el `if (supabase)` dejaba pasar
  // tráfico anónimo a una ruta que gasta IA si faltaba una env var).
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'No disponible.' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const companyId = await getActiveCompanyId(supabase, user.id);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const { brand, objective, channel, profiles } = body || {};
  if (!brand?.brandName || !brand?.offer || !brand?.brief) {
    return NextResponse.json({ error: 'Faltan datos de marca (brandName, offer, brief).' }, { status: 400 });
  }

  // Gate de acceso + cuota mensual ANTES de gastar IA (cierra la fuga de IA gratis).
  const guard = await guardAiAccess(supabase, user, companyId);
  if (!guard.ok) return guard.response;

  try {
    const result = await generateAngles({
      brand,
      objective: objective || 'deseo',
      channel: channel || 'instagram',
      profiles: (profiles as ProfileKey[]) || [],
      tier: await getBudgetTier(),
    });
    // Registra consumo + descuenta créditos (antes esto no se cobraba nunca).
    // generateAngles ya devuelve usage con tokens/modelo/costo reales; el proveedor
    // se infiere del id de modelo (mismo criterio que estimateCostUsd).
    const u = result.usage;
    const provider = /claude/i.test(u.model) ? 'claude' : /gemini/i.test(u.model) ? 'gemini' : 'gpt';
    const credits = await chargeAiUsage(supabase, {
      access: guard.access, companyId, userId: user.id, agentSlug: 'eq',
      provider, model: u.model, kind: 'agent_run',
      tokensIn: u.inputTokens, tokensOut: u.outputTokens, costUsd: u.costUsd,
    });
    return NextResponse.json({ ...result, credits });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error generando' }, { status: 500 });
  }
}
