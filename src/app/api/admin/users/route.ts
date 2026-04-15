import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// GET /api/admin/users?email=xxx - Find user by email
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check admin role
  const db = createServiceClient()
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 })

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  // Find user in auth.users via profiles (we can't query auth.users directly with service client)
  const { data: foundProfile } = await db
    .from('profiles')
    .select('id, full_name, role')
    .ilike('id', '%') // We need to find by email, use auth admin
    .limit(1)

  // Use admin API to find user by email
  const { data: authData } = await db.auth.admin.listUsers({ perPage: 1000 })
  const targetUser = authData?.users?.find(u => u.email === email.toLowerCase())

  if (!targetUser) {
    return NextResponse.json({ error: 'Usuario no encontrado. Debe registrarse primero.' }, { status: 404 })
  }

  // Get profile
  const { data: userProfile } = await db
    .from('profiles')
    .select('full_name, role')
    .eq('id', targetUser.id)
    .single()

  // Get subscriptions
  const { data: subs } = await db
    .from('subscriptions')
    .select('app_id, status')
    .eq('user_id', targetUser.id)

  return NextResponse.json({
    user: {
      id: targetUser.id,
      email: targetUser.email,
      created_at: targetUser.created_at,
      full_name: userProfile?.full_name || null,
      role: userProfile?.role || 'user',
      subscriptions: subs || [],
    },
  })
}

// POST /api/admin/users - Activate/deactivate apps for a user
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 })

  // Check admin role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await request.json()
  const { userId, email, appId, action } = body

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  if (action === 'activate-all') {
    // Activate all apps
    const { data: apps } = await db.from('apps').select('id')
    if (apps) {
      for (const app of apps) {
        await db
          .from('subscriptions')
          .upsert({
            user_id: userId,
            app_id: app.id,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          }, { onConflict: 'user_id,app_id' })
      }
    }

    // Also assign to Cereus Privat maison if not already
    const { data: maisonClient } = await db
      .from('app_clients')
      .select('id')
      .eq('app_id', 'cereus')
      .eq('nombre', 'Privat')
      .single()

    if (maisonClient) {
      await db
        .from('app_client_users')
        .upsert({
          client_id: maisonClient.id,
          user_id: userId,
          rol: 'admin',
          email: email || '',
          nombre_contacto: email?.split('@')[0] || '',
          activo: true,
        }, { onConflict: 'client_id,user_id' })
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'activate' && appId) {
    await db
      .from('subscriptions')
      .upsert({
        user_id: userId,
        app_id: appId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'user_id,app_id' })

    return NextResponse.json({ success: true })
  }

  if (action === 'deactivate' && appId) {
    await db
      .from('subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('app_id', appId)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
