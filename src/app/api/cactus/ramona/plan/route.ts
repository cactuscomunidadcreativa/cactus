import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { planFromGoal } from '@/lib/cactus/ramona';
import { getActiveCompanyId, getActiveBrandKit } from '@/lib/cactus/companies';
import { getDefaultProvider } from '@/lib/ai/provider-factory';
import { guardAiAccess, chargeAiUsage } from '@/lib/cactus/ai-guard';

export const maxDuration = 60;

export async function POST(req: Request) {
  // Fail-closed: sin Supabase NO se atiende (antes el `if (supabase)` dejaba pasar
  // tráfico anónimo a una ruta que gasta IA si faltaba una env var).
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'No disponible.' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // marca de la empresa activa (si la tabla/columna existe)
  const companyId = await getActiveCompanyId(supabase, user.id);
  const brand = await getActiveBrandKit(supabase, user.id, companyId);

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }
  if (!body?.goal) return NextResponse.json({ error: 'Falta el objetivo.' }, { status: 400 });

  // Gate de acceso + cuota mensual ANTES de gastar IA (cierra la fuga de IA gratis).
  const guard = await guardAiAccess(supabase, user, companyId);
  if (!guard.ok) return guard.response;

  try {
    const plan = await planFromGoal({ goal: body.goal, brand });
    // Registra la corrida para auditoría + cuota. planFromGoal no expone tokens ni
    // modelo, así que best-effort: proveedor por defecto real, tokens/costo en 0.
    const provider = await getDefaultProvider();
    const credits = await chargeAiUsage(supabase, {
      access: guard.access, companyId, userId: user.id, agentSlug: 'ramona',
      provider, model: provider, kind: 'agent_run',
      tokensIn: 0, tokensOut: 0, costUsd: 0,
    });
    return NextResponse.json({ plan, credits });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error armando el plan' }, { status: 500 });
  }
}
