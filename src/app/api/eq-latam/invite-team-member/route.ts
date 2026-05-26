import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * Invite an internal team member via Supabase Auth magic link.
 *
 * Body: { user_id: 'natalia' | ..., email: '...', name?: '...' }
 *
 * The user_id matches an existing row in eq_users; on accept, we link
 * the new auth.users.id back to that eq_users row.
 *
 * Admin (Eduardo) only.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('eq_users')
    .select('role')
    .eq('auth_user_id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Only admin can invite team' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { user_id, email, name } = body;
  if (!user_id || !email) {
    return NextResponse.json({ error: 'user_id and email required' }, { status: 400 });
  }

  // Verify the eq_users row exists
  const { data: target } = await supabase
    .from('eq_users')
    .select('id, name, email')
    .eq('id', user_id)
    .single();
  if (!target) {
    return NextResponse.json({ error: 'eq_users row not found' }, { status: 404 });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: 'Service role not configured' }, { status: 503 });
  }

  const redirectTo = `${req.nextUrl.origin}/apps/eq-latam`;
  const { data: inviteData, error: inviteErr } = await service.auth.admin.inviteUserByEmail(email, {
    data: { eq_user_id: user_id, name: name ?? target.name },
    redirectTo,
  });

  if (inviteErr && !String(inviteErr.message).toLowerCase().includes('already')) {
    return NextResponse.json({ error: inviteErr.message }, { status: 500 });
  }

  const authUserId = inviteData?.user?.id ?? null;

  // Link auth user → eq_users row
  if (authUserId) {
    await service
      .from('eq_users')
      .update({ auth_user_id: authUserId, email: email })
      .eq('id', user_id);
  }

  return NextResponse.json({ success: true, auth_user_id: authUserId, redirect_to: redirectTo });
}
