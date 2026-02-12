import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Get clients for an app (admin) or user's client
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');

    if (!appId) {
      return NextResponse.json({ error: 'App ID is required' }, { status: 400 });
    }

    // Check if super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    const isSuperAdmin = profile?.is_super_admin || false;

    if (isSuperAdmin) {
      // Admin: return all clients for this app
      const { data: clients, error } = await supabase
        .from('app_clients')
        .select(`
          *,
          app_client_users (
            id,
            user_id,
            nombre_contacto,
            email,
            phone,
            rol,
            activo
          )
        `)
        .eq('app_id', appId)
        .order('nombre');

      if (error) throw error;

      return NextResponse.json({ clients, isAdmin: true });
    }

    // Regular user: return their assigned client
    const { data: userClient } = await supabase
      .from('app_client_users')
      .select(`
        id,
        nombre_contacto,
        rol,
        client:app_clients (
          id,
          nombre,
          config,
          activo
        )
      `)
      .eq('user_id', user.id)
      .eq('activo', true)
      .single();

    if (!userClient || !userClient.client) {
      return NextResponse.json({
        hasAccess: false,
        client: null,
      });
    }

    const clientData = userClient.client as any;
    if (clientData.app_id !== appId) {
      return NextResponse.json({
        hasAccess: false,
        client: null,
      });
    }

    return NextResponse.json({
      hasAccess: true,
      client: clientData,
      userInfo: {
        nombreContacto: userClient.nombre_contacto,
        rol: userClient.rol,
      },
    });

  } catch (error: any) {
    console.error('App clients GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching clients' },
      { status: 500 }
    );
  }
}

// POST - Create a new client (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { appId, nombre, config = {} } = body;

    if (!appId || !nombre) {
      return NextResponse.json({ error: 'App ID and name are required' }, { status: 400 });
    }

    const { data: client, error } = await supabase
      .from('app_clients')
      .insert({
        app_id: appId,
        nombre,
        config,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, client });

  } catch (error: any) {
    console.error('App clients POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Error creating client' },
      { status: 500 }
    );
  }
}

// PUT - Update a client (admin only)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, nombre, config, activo } = body;

    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (nombre !== undefined) updateData.nombre = nombre;
    if (config !== undefined) updateData.config = config;
    if (activo !== undefined) updateData.activo = activo;

    const { data: client, error } = await supabase
      .from('app_clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, client });

  } catch (error: any) {
    console.error('App clients PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Error updating client' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a client (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('app_clients')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('App clients DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Error deleting client' },
      { status: 500 }
    );
  }
}
