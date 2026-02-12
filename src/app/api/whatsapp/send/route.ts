import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Send a WhatsApp message (admin only, for testing).
 * In production, this would use the Twilio adapter.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Admin only
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { phone, message } = await req.json();
  if (!phone || !message) {
    return NextResponse.json({ error: 'phone and message required' }, { status: 400 });
  }

  // Save as outbound
  await supabase.from('wa_messages').insert({
    phone,
    user_id: null,
    direction: 'outbound',
    content: message,
    module: 'admin',
    processed: true,
  });

  return NextResponse.json({ success: true });
}
