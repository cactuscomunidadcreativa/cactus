import { cookies } from 'next/headers';
import { BUDGET_COOKIE, DEFAULT_TIER, isBudgetTier, type BudgetTier } from './budget';

/** Lee el perfil de presupuesto del usuario desde la cookie (server-side). */
export async function getBudgetTier(): Promise<BudgetTier> {
  try {
    const store = await cookies();
    const v = store.get(BUDGET_COOKIE)?.value;
    if (isBudgetTier(v)) return v;
  } catch { /* noop */ }
  return DEFAULT_TIER;
}
