import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const phone = req.nextUrl.searchParams.get('phone');

  let query = supabase
    .from('wa_messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(50);

  // Admin can see all, regular users see own
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    query = query.eq('user_id', user.id);
  }

  if (phone) {
    query = query.eq('phone', phone);
  }

  const { data: messages } = await query;

  return NextResponse.json({ messages: messages || [] });
}
