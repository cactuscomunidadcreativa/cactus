// ═══════════════════════════════════════════════════════════════════════════
// Guard de acceso para endpoints que GASTAN IA. Centraliza lo que ya hacía
// orchestrator/execute pero FALTABA en /api/cactus/agent (lo usan las 28 apps) y
// en las rutas de medios (design/voice/music…): (1) exigir plan/créditos activos,
// (2) respetar el tope mensual de tokens del plan, y (3) registrar consumo +
// descontar créditos al terminar. Sin esto, cualquier usuario logueado tenía IA
// ilimitada y gratis. Resiliente: el cobro/registro nunca tumba una respuesta ya
// generada (best-effort); el gate sí bloquea antes de gastar.
// ═══════════════════════════════════════════════════════════════════════════
import { NextResponse } from 'next/server';
import { getAccessStatus, NO_PLAN_REPLY, type AccessStatus } from './access';
import { getCompanyPlan } from './agent-access';
import { checkQuota, registerUsage } from './usage';
import { raiseAlert } from './alerts';
import { recordModelUsage } from './audit';
import { usdToCredits } from './credits';

type DB = any;

export type AiGuardResult =
  | { ok: true; access: AccessStatus }
  | { ok: false; response: NextResponse };

/** Verifica acceso (plan/créditos) y cuota mensual ANTES de gastar IA.
 *  Devuelve {ok:false, response} listo para retornar, o {ok:true, access}. */
export async function guardAiAccess(
  db: DB,
  user: { id: string; email?: string | null },
  companyId: string | null,
): Promise<AiGuardResult> {
  const access = await getAccessStatus(db, user);
  if (!access.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { blocked: true, reason: 'no_plan', error: NO_PLAN_REPLY, reply: NO_PLAN_REPLY, upgradeHref: '/packs' },
        { status: 402 },
      ),
    };
  }
  if (companyId && !access.byok) {
    const plan = await getCompanyPlan(db, companyId);
    const quota = await checkQuota(db, companyId, plan.tokens_monthly);
    if (quota.over) {
      try {
        await raiseAlert(db, {
          companyId, origin: 'agave', type: 'quota', severity: 'warning',
          title: 'Cuota de tokens del mes alcanzada',
          dedupKey: `quota-${plan.slug}-${quota.limit}`,
          body: `Se usaron ${quota.used.toLocaleString()} de ${quota.limit.toLocaleString()} tokens este mes.`,
        });
      } catch { /* alerta best-effort */ }
      return {
        ok: false,
        response: NextResponse.json(
          {
            blocked: true, reason: 'quota', upgradeHref: '/packs',
            error: 'Llegaste al tope de tokens de tu plan este mes. Sube de plan o recarga.',
            reply: 'Llegaste al tope de tokens de tu plan este mes. Sube de plan o recarga para que el equipo siga. 🌵',
          },
          { status: 402 },
        ),
      };
    }
  }
  return { ok: true, access };
}

/** Registra consumo + descuenta créditos DESPUÉS de una llamada de IA exitosa.
 *  Best-effort: nunca lanza. Devuelve los créditos cobrados. */
export async function chargeAiUsage(
  db: DB,
  opts: {
    access: AccessStatus;
    companyId: string | null;
    userId: string;
    agentSlug: string;
    provider: string;
    model: string;
    kind?: 'agent_run' | 'subagent' | 'chat' | 'observer';
    tokensIn?: number;
    tokensOut?: number;
    costUsd: number;
  },
): Promise<number> {
  const credits = usdToCredits(opts.costUsd);
  try {
    await registerUsage(db, {
      companyId: opts.companyId, userId: opts.userId, agentSlug: opts.agentSlug, model: opts.model,
      tokensIn: opts.tokensIn || 0, tokensOut: opts.tokensOut || 0, costUsd: opts.costUsd, credits,
    });
  } catch { /* noop */ }
  try {
    await recordModelUsage(db, {
      companyId: opts.companyId, userId: opts.userId, agentSlug: opts.agentSlug,
      provider: opts.provider, model: opts.model, kind: opts.kind || 'agent_run',
      tokensIn: opts.tokensIn || 0, tokensOut: opts.tokensOut || 0, costUsd: opts.costUsd, credits,
    });
  } catch { /* noop */ }
  // Descuenta créditos (salvo byok/super-admin con créditos ilimitados)
  if (!opts.access.byok && opts.access.credits >= 0) {
    try {
      const { data: w } = await db.from('cactus_credit_wallets').select('balance').eq('user_id', opts.userId).maybeSingle();
      if (w) {
        await db.from('cactus_credit_wallets')
          .update({ balance: Math.max(0, (w.balance || 0) - credits) }).eq('user_id', opts.userId);
      }
      await db.from('cactus_credit_ledger').insert({
        user_id: opts.userId, delta: -credits, reason: 'agent_run', agent_slug: opts.agentSlug,
        model: opts.model, cost_usd: opts.costUsd, ...(opts.companyId ? { company_id: opts.companyId } : {}),
      });
    } catch { /* noop */ }
  }
  return credits;
}
