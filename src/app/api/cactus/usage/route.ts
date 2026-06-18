import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { getCompanyPlan } from '@/lib/cactus/agent-access';
import { checkQuota, getMonthUsageByAgent } from '@/lib/cactus/usage';

// GET → consumo del mes por agente + estado de cuota del plan.
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ byAgent: [], quota: null, plan: null });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const companyId = await getActiveCompanyId(supabase, user.id);
  const plan = await getCompanyPlan(supabase, companyId);
  const [byAgent, quota] = await Promise.all([
    getMonthUsageByAgent(supabase, companyId),
    checkQuota(supabase, companyId, plan.tokens_monthly),
  ]);
  return NextResponse.json({ byAgent, quota, plan: { slug: plan.slug, name: plan.name, tokens_monthly: plan.tokens_monthly } });
}
