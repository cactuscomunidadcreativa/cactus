import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;
  const { supabase } = result;

  const { data: entries } = await supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return NextResponse.json({ entries: entries || [] });
}
