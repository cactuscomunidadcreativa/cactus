// ═══════════════════════════════════════════════════════════════════════════
// Gate de acceso de Ramona: ¿el usuario puede poner a trabajar a los agentes?
// Regla (elegida por el negocio): suscripción activa O créditos disponibles.
// El super-admin siempre puede. Resiliente a tablas faltantes.
// ═══════════════════════════════════════════════════════════════════════════
import { isSuperAdmin } from '@/lib/admin/auth';

export interface AccessStatus {
  allowed: boolean;
  hasSubscription: boolean;
  credits: number;   // -1 = ilimitado (byok / super-admin)
  byok: boolean;
  reason: 'ok' | 'no_plan';
}

type DB = any;

export async function getAccessStatus(
  db: DB,
  user: { id: string; email?: string | null },
): Promise<AccessStatus> {
  if (isSuperAdmin(user.email)) {
    return { allowed: true, hasSubscription: true, credits: -1, byok: true, reason: 'ok' };
  }

  // Suscripción activa (cualquier app cuenta como plan activo)
  const { data: subs } = await db
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .limit(1);
  const hasSubscription = !!(subs && subs.length);

  // Wallet de créditos
  const { data: wallet } = await db
    .from('cactus_credit_wallets')
    .select('balance, byok')
    .eq('user_id', user.id)
    .maybeSingle();
  const byok = !!wallet?.byok;
  const credits = byok ? -1 : (wallet?.balance ?? 0);

  const allowed = hasSubscription || byok || credits > 0;
  return { allowed, hasSubscription, credits, byok, reason: allowed ? 'ok' : 'no_plan' };
}

/** Mensaje de Ramona cuando no hay plan activo. */
export const NO_PLAN_REPLY =
  'No puedo poner al equipo a trabajar todavía: tu plan no está activo. ' +
  'Renueva tu plan o recarga créditos y coordino a los agentes enseguida. 🌵';
