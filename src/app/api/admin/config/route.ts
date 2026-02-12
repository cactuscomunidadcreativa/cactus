import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { clearConfigCache } from '@/lib/ai/config';

export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;
  const { supabase } = result;

  const { data: configs } = await supabase
    .from('platform_config')
    .select('key, value, encrypted, description, updated_by, updated_at')
    .order('key');

  // Mask encrypted values
  const masked = (configs || []).map((c: any) => ({
    ...c,
    value: c.encrypted && c.value ? '••••••••' : c.value,
  }));

  return NextResponse.json({ configs: masked });
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

  const { key, value } = body;
  if (!key || typeof key !== 'string') {
    return NextResponse.json({ error: 'key is required and must be a string' }, { status: 400 });
  }

  // Don't save masked placeholder values
  if (value === '••••••••') {
    return NextResponse.json({ success: true, skipped: true });
  }

  await supabase
    .from('platform_config')
    .upsert({
      key,
      value: value || '',
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

  // Log audit
  await supabase.from('admin_audit_log').insert({
    admin_id: user.id,
    action: 'config_updated',
    target_type: 'platform_config',
    target_id: key,
    details: { key, masked: true },
  });

  // Clear AI config cache so changes take effect
  clearConfigCache();

  return NextResponse.json({ success: true });
}
