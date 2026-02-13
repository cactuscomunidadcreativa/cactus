import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/cereus/maison — Get current user's maison
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check if super_admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isSuperAdmin = profile?.role === 'super_admin';

  if (isSuperAdmin) {
    // Admin: return first cereus maison (or all)
    const { data: maisons } = await supabase
      .from('app_clients')
      .select('*')
      .eq('app_id', 'cereus')
      .eq('activo', true)
      .order('created_at');

    if (!maisons || maisons.length === 0) {
      return NextResponse.json({ hasAccess: false, maison: null });
    }

    return NextResponse.json({
      hasAccess: true,
      maison: maisons[0],
      allMaisons: maisons,
      role: 'admin',
    });
  }

  // Regular user: find their maison
  const { data: userClient } = await supabase
    .from('app_client_users')
    .select('*, client:app_clients(*)')
    .eq('user_id', user.id)
    .eq('activo', true)
    .single();

  if (!userClient || !userClient.client || userClient.client.app_id !== 'cereus') {
    return NextResponse.json({ hasAccess: false, maison: null });
  }

  return NextResponse.json({
    hasAccess: true,
    maison: userClient.client,
    role: userClient.rol,
  });
}
