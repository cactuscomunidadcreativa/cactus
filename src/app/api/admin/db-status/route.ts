import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createClient as createSb } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const TABLES = ['cactus_brand_kits', 'cactus_campaigns', 'cactus_agent_configs', 'cactus_credit_wallets', 'cactus_model_costs', 'organizations', 'companies', 'memberships', 'plans', 'agent_configs', 'user_ai_controls', 'agent_activations', 'usage_daily', 'user_usage', 'alerts', 'domains', 'channels', 'knowledge_chunks', 'model_usage'];

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ setup: false, tables: {}, error: 'Supabase no configurado' });

  const sb = createSb(url, key, { auth: { persistSession: false } });
  const tables: Record<string, boolean> = {};
  for (const t of TABLES) {
    const { error } = await sb.from(t).select('*', { head: true, count: 'exact' }).limit(0);
    tables[t] = !error;
  }
  const setup = Object.values(tables).every(Boolean);
  return NextResponse.json({ setup, tables });
}
