import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { getMonthKey } from '@/lib/utils';

export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;
  const { supabase } = result;

  const month = getMonthKey();

  const { data: budgets } = await supabase
    .from('token_budgets')
    .select('*')
    .eq('month', month)
    .order('monthly_tokens_used', { ascending: false });

  return NextResponse.json({ budgets: budgets || [] });
}

export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;
  const { supabase, user } = result;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { user_id, app_id, monthly_token_limit, monthly_generation_limit } = body;

  if (!user_id || !app_id) {
    return NextResponse.json({ error: 'user_id and app_id required' }, { status: 400 });
  }

  if (monthly_token_limit !== undefined && typeof monthly_token_limit !== 'number') {
    return NextResponse.json({ error: 'monthly_token_limit must be a number' }, { status: 400 });
  }

  if (monthly_generation_limit !== undefined && typeof monthly_generation_limit !== 'number') {
    return NextResponse.json({ error: 'monthly_generation_limit must be a number' }, { status: 400 });
  }

  const month = getMonthKey();

  await supabase.from('token_budgets').upsert({
    user_id,
    app_id,
    month,
    monthly_token_limit: monthly_token_limit ?? -1,
    monthly_generation_limit: monthly_generation_limit ?? -1,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,app_id,month' });

  // Audit log
  await supabase.from('admin_audit_log').insert({
    admin_id: user.id,
    action: 'budget_updated',
    target_type: 'token_budgets',
    target_id: user_id,
    details: { app_id, monthly_token_limit, monthly_generation_limit },
  });

  return NextResponse.json({ success: true });
}
