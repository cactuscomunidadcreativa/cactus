import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/cereus/maison — Get current user's maison
export async function GET() {
  // 1. Auth check (user session)
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Use service client for data queries (bypasses RLS)
  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  // 3. Check if super_admin
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isSuperAdmin = profile?.role === 'super_admin';

  if (isSuperAdmin) {
    // Admin: return all cereus maisons
    const { data: maisons } = await db
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

  // 4. Regular user: find their cereus maison via app_client_users
  const { data: assignments } = await db
    .from('app_client_users')
    .select('rol, client:app_clients(*)')
    .eq('user_id', user.id)
    .eq('activo', true);

  const cereusAssignment = assignments?.find(
    (a: any) => a.client?.app_id === 'cereus'
  );

  if (!cereusAssignment || !cereusAssignment.client) {
    return NextResponse.json({ hasAccess: false, maison: null });
  }

  return NextResponse.json({
    hasAccess: true,
    maison: cereusAssignment.client,
    role: cereusAssignment.rol,
  });
}
