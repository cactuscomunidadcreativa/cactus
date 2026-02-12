import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List clients (admin) or get user's client
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

    // Check if super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    const isSuperAdmin = profile?.is_super_admin === true;

    if (isSuperAdmin) {
      // Admin: get all clients with their users
      const { data: clients, error } = await supabase
        .from('agave_clients')
        .select(`
          *,
          agave_client_users (
            id,
            user_id,
            nombre_contacto,
            rol,
            activo
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json({ clients, isAdmin: true });
    } else {
      // Regular user: get their client(s)
      const { data: clientUsers, error: cuError } = await supabase
        .from('agave_client_users')
        .select(`
          id,
          nombre_contacto,
          rol,
          activo,
          client:agave_clients (
            id,
            nombre,
            mensajes,
            idioma_default,
            margen_objetivo,
            tipo_costo_default,
            moneda,
            rangos_margen,
            activo
          )
        `)
        .eq('user_id', user.id)
        .eq('activo', true);

      if (cuError) throw cuError;

      if (!clientUsers || clientUsers.length === 0) {
        return NextResponse.json({ client: null, hasAccess: false });
      }

      // Return the first active client (users typically have one)
      // Note: client is returned as an object, not array, when using .single() style select
      const activeClient = clientUsers.find(cu => {
        const clientData = cu.client as any;
        return clientData?.activo === true;
      });
      if (!activeClient) {
        return NextResponse.json({ client: null, hasAccess: false });
      }

      return NextResponse.json({
        client: activeClient.client,
        userInfo: {
          nombreContacto: activeClient.nombre_contacto,
          rol: activeClient.rol,
        },
        hasAccess: true,
      });
    }
  } catch (error: any) {
    console.error('AGAVE clients GET error:', error);
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
    const {
      nombre,
      mensajes,
      idioma_default,
      margen_objetivo,
      tipo_costo_default,
      moneda,
      rangos_margen,
      users, // Array of { user_id, nombre_contacto, rol }
    } = body;

    if (!nombre) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    // Create client
    const { data: client, error: clientError } = await supabase
      .from('agave_clients')
      .insert({
        nombre,
        mensajes,
        idioma_default,
        margen_objetivo,
        tipo_costo_default,
        moneda,
        rangos_margen,
      })
      .select()
      .single();

    if (clientError) throw clientError;

    // Add users to client if provided
    if (users && users.length > 0) {
      const clientUsers = users.map((u: any) => ({
        client_id: client.id,
        user_id: u.user_id,
        nombre_contacto: u.nombre_contacto,
        rol: u.rol || 'user',
      }));

      const { error: usersError } = await supabase
        .from('agave_client_users')
        .insert(clientUsers);

      if (usersError) {
        console.error('Error adding users to client:', usersError);
      }
    }

    return NextResponse.json({ client, success: true });
  } catch (error: any) {
    console.error('AGAVE clients POST error:', error);
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Remove users from updates (handled separately)
    const { users, ...clientUpdates } = updates;

    // Update client
    const { data: client, error: clientError } = await supabase
      .from('agave_clients')
      .update({ ...clientUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (clientError) throw clientError;

    return NextResponse.json({ client, success: true });
  } catch (error: any) {
    console.error('AGAVE clients PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Error updating client' },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate a client (admin only)
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

    // Soft delete (deactivate)
    const { error } = await supabase
      .from('agave_clients')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('AGAVE clients DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Error deleting client' },
      { status: 500 }
    );
  }
}
