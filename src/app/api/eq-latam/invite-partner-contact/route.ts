import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// Auth-gated route; never prerender.
export const dynamic = 'force-dynamic';

/**
 * Invites a partner contact via Supabase Auth magic link.
 *
 * POST body:
 *   partner_id: string
 *   name:       string
 *   email:      string
 *   role:       'lead' | 'collaborator'
 *
 * Requires the caller to be Eduardo (admin). Verified via eq_users.role.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  // Verify caller is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify caller is admin in eq_users
  const { data: profile } = await supabase
    .from('eq_users')
    .select('role')
    .eq('auth_user_id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Only admin can invite partner contacts' }, { status: 403 });
  }

  // Parse body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { partner_id, name, email, role } = body;
  if (!partner_id || !email || !name || !role) {
    return NextResponse.json(
      { error: 'partner_id, name, email, role are required' },
      { status: 400 },
    );
  }
  if (!['lead', 'collaborator'].includes(role)) {
    return NextResponse.json({ error: 'role must be lead or collaborator' }, { status: 400 });
  }

  // Verify partner exists
  const { data: partner } = await supabase
    .from('eq_partners')
    .select('id, name')
    .eq('id', partner_id)
    .single();
  if (!partner) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
  }

  // Use service-role client to invite via Admin API (RLS-bypassing)
  const service = createServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: 'Service role not configured — cannot send invite' },
      { status: 503 },
    );
  }

  // Magic-link invite
  const redirectTo = `${req.nextUrl.origin}/apps/eq-latam/partner/${partner_id}`;
  const { data: inviteData, error: inviteErr } = await service.auth.admin.inviteUserByEmail(email, {
    data: { partner_id, partner_name: partner.name, contact_name: name, role },
    redirectTo,
  });

  if (inviteErr) {
    // If the user already exists in auth.users, that's fine — proceed to upsert contact
    if (!String(inviteErr.message).toLowerCase().includes('already')) {
      console.error('[invite-partner-contact] inviteUserByEmail error:', inviteErr);
      return NextResponse.json({ error: inviteErr.message }, { status: 500 });
    }
  }

  const authUserId = inviteData?.user?.id ?? null;

  // Upsert eq_partner_contacts row
  const contactId = `${partner_id}-${email.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
  const { error: upsertErr } = await service
    .from('eq_partner_contacts')
    .upsert({
      id: contactId,
      partner_id,
      name,
      email,
      role,
      auth_user_id: authUserId,
      invited_at: new Date().toISOString(),
      active: true,
    })
    .select();

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    contact_id: contactId,
    auth_user_id: authUserId,
    redirect_to: redirectTo,
  });
}
