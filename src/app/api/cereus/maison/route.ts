import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/cereus/maison — Get current user's maison
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check if super_admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isSuperAdmin = profile?.role === 'super_admin';

  if (isSuperAdmin) {
    // Admin: return first cereus maison (or all)
    const { data: maisons, error: maisonError } = await supabase
      .from('app_clients')
      .select('*')
      .eq('app_id', 'cereus')
      .eq('activo', true)
      .order('created_at');

    if (maisonError) {
      console.error('[cereus/maison] Error fetching maisons:', maisonError);
      return NextResponse.json({ hasAccess: false, maison: null, debug: { error: maisonError.message, code: maisonError.code } });
    }

    if (!maisons || maisons.length === 0) {
      return NextResponse.json({ hasAccess: false, maison: null, debug: { reason: 'no_maisons_found', isSuperAdmin: true } });
    }

    return NextResponse.json({
      hasAccess: true,
      maison: maisons[0],
      allMaisons: maisons,
      role: 'admin',
    });
  }

  // Regular user: find their maison via app_client_users
  const { data: assignments, error: assignError } = await supabase
    .from('app_client_users')
    .select('*, client:app_clients(*)')
    .eq('user_id', user.id)
    .eq('activo', true);

  if (assignError) {
    console.error('[cereus/maison] Error fetching assignments:', assignError);
    return NextResponse.json({ hasAccess: false, maison: null, debug: { error: assignError.message } });
  }

  // Find the cereus assignment
  const cereusAssignment = assignments?.find(
    (a: any) => a.client?.app_id === 'cereus'
  );

  if (!cereusAssignment || !cereusAssignment.client) {
    return NextResponse.json({
      hasAccess: false,
      maison: null,
      debug: {
        reason: 'no_cereus_assignment',
        isSuperAdmin: false,
        profileRole: profile?.role,
        profileError: profileError?.message,
        totalAssignments: assignments?.length || 0,
      },
    });
  }

  return NextResponse.json({
    hasAccess: true,
    maison: cereusAssignment.client,
    role: cereusAssignment.rol,
  });
}
