import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { getMonthKey } from '@/lib/utils';

export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;
  const { supabase } = result;

  const month = getMonthKey();

  // Get budgets for this month
  const { data: budgets } = await supabase
    .from('token_budgets')
    .select('*')
    .eq('month', month);

  const allBudgets = budgets || [];

  const totalUsers = new Set(allBudgets.map((b: any) => b.user_id)).size;
  const totalGenerations = allBudgets.reduce((sum: number, b: any) => sum + (b.monthly_generations_used || 0), 0);
  const totalTokens = allBudgets.reduce((sum: number, b: any) => sum + (b.monthly_tokens_used || 0), 0);

  // By app
  const byAppMap = new Map<string, { generations: number; tokens: number }>();
  for (const b of allBudgets) {
    const existing = byAppMap.get(b.app_id) || { generations: 0, tokens: 0 };
    existing.generations += b.monthly_generations_used || 0;
    existing.tokens += b.monthly_tokens_used || 0;
    byAppMap.set(b.app_id, existing);
  }
  const byApp = Array.from(byAppMap.entries()).map(([app_id, stats]) => ({
    app_id,
    ...stats,
  }));

  // Top users
  const userMap = new Map<string, { generations: number; tokens: number }>();
  for (const b of allBudgets) {
    const existing = userMap.get(b.user_id) || { generations: 0, tokens: 0 };
    existing.generations += b.monthly_generations_used || 0;
    existing.tokens += b.monthly_tokens_used || 0;
    userMap.set(b.user_id, existing);
  }
  const topUsers = Array.from(userMap.entries())
    .map(([user_id, stats]) => ({ user_id, email: '', ...stats }))
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 10);

  return NextResponse.json({
    totalUsers,
    totalGenerations,
    totalTokens,
    byApp,
    topUsers,
  });
}
