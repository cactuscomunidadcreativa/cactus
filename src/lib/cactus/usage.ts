// ═══════════════════════════════════════════════════════════════════════════
// Consumo + cuotas (Fase A · Acción 4)
// registerUsage() → RPC atómica cactus_register_usage (acumula por día).
// checkQuota() → suma tokens del mes vs plan.tokens_monthly (0 = ilimitado).
// Resiliente: si las tablas/RPC no existen, no rompe el flujo.
// ═══════════════════════════════════════════════════════════════════════════
type DB = any;

export interface UsageInput {
  companyId: string | null;
  userId: string | null;
  agentSlug?: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  credits?: number;
}

/** Registra consumo (best-effort). No lanza: el consumo nunca debe tumbar la tarea. */
export async function registerUsage(db: DB, u: UsageInput): Promise<void> {
  if (!db || (!u.companyId && !u.userId)) return;
  try {
    await db.rpc('cactus_register_usage', {
      p_company: u.companyId,
      p_user: u.userId,
      p_agent: u.agentSlug || 'unknown',
      p_model: u.model || 'unknown',
      p_tokens_in: Math.round(u.tokensIn || 0),
      p_tokens_out: Math.round(u.tokensOut || 0),
      p_cost: u.costUsd || 0,
      p_credits: Math.round(u.credits || 0),
    });
  } catch {
    /* RPC ausente o error → ignorar (el ledger de créditos sigue siendo la fuente principal) */
  }
}

export interface QuotaStatus {
  over: boolean;
  used: number;     // tokens del mes (in+out)
  limit: number;    // 0 = ilimitado
  remaining: number; // -1 = ilimitado
}

function monthStart(): string {
  // primer día del mes en formato YYYY-MM-DD (UTC) — sin Date.now arbitrario en SQL
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

/** Consumo del mes vs el tope del plan. over=true si excede (→ 402). */
export async function checkQuota(db: DB, companyId: string | null, tokensMonthly: number): Promise<QuotaStatus> {
  const limit = tokensMonthly || 0;
  if (!db || !companyId || limit <= 0) {
    return { over: false, used: 0, limit, remaining: -1 };
  }
  try {
    const { data } = await db
      .from('usage_daily')
      .select('tokens_in, tokens_out')
      .eq('company_id', companyId)
      .gte('day', monthStart());
    const used = (data || []).reduce((s: number, r: any) => s + Number(r.tokens_in || 0) + Number(r.tokens_out || 0), 0);
    return { over: used >= limit, used, limit, remaining: Math.max(0, limit - used) };
  } catch {
    return { over: false, used: 0, limit, remaining: -1 };
  }
}

/** Consumo del mes desglosado por agente (para la vista de consumo vivo). */
export async function getMonthUsageByAgent(db: DB, companyId: string | null): Promise<Array<{ agent_slug: string; tokens: number; calls: number; cost_usd: number; credits: number }>> {
  if (!db || !companyId) return [];
  try {
    const { data } = await db
      .from('usage_daily')
      .select('agent_slug, tokens_in, tokens_out, calls, cost_usd, credits')
      .eq('company_id', companyId)
      .gte('day', monthStart());
    const agg: Record<string, { agent_slug: string; tokens: number; calls: number; cost_usd: number; credits: number }> = {};
    for (const r of (data || [])) {
      const k = r.agent_slug || 'unknown';
      agg[k] ||= { agent_slug: k, tokens: 0, calls: 0, cost_usd: 0, credits: 0 };
      agg[k].tokens += Number(r.tokens_in || 0) + Number(r.tokens_out || 0);
      agg[k].calls += Number(r.calls || 0);
      agg[k].cost_usd += Number(r.cost_usd || 0);
      agg[k].credits += Number(r.credits || 0);
    }
    return Object.values(agg).sort((a, b) => b.tokens - a.tokens);
  } catch {
    return [];
  }
}
