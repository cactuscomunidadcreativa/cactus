import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Accept an invitation and assign user to client
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database connection error' }, { status: 500 });
    }

    const body = await request.json();
    const { token, userId } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Get invitation from platform_config
    const { data: config } = await supabase
      .from('platform_config')
      .select('value')
      .eq('key', `agave_invite_${token}`)
      .single();

    if (!config) {
      return NextResponse.json({ success: false, error: 'Invitacion no encontrada' }, { status: 404 });
    }

    const inviteData = JSON.parse(config.value);

    // Check if expired
    if (new Date(inviteData.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: 'Invitacion expirada' }, { status: 400 });
    }

    // Check if user is already assigned to this client
    const { data: existingAssignment } = await supabase
      .from('agave_client_users')
      .select('id')
      .eq('client_id', inviteData.clientId)
      .eq('user_id', userId)
      .single();

    if (existingAssignment) {
      // User already assigned, just delete the invite and return success
      await supabase
        .from('platform_config')
        .delete()
        .eq('key', `agave_invite_${token}`);

      return NextResponse.json({
        success: true,
        message: 'Usuario ya asignado al cliente',
        clientId: inviteData.clientId,
      });
    }

    // Assign user to client
    const { error: assignError } = await supabase
      .from('agave_client_users')
      .insert({
        client_id: inviteData.clientId,
        user_id: userId,
        nombre_contacto: inviteData.nombreContacto,
        rol: inviteData.rol || 'user',
        activo: true,
      });

    if (assignError) {
      console.error('Error assigning user:', assignError);
      return NextResponse.json({ success: false, error: 'Error asignando usuario' }, { status: 500 });
    }

    // Delete the used invitation
    await supabase
      .from('platform_config')
      .delete()
      .eq('key', `agave_invite_${token}`);

    return NextResponse.json({
      success: true,
      message: 'Usuario asignado exitosamente',
      clientId: inviteData.clientId,
    });

  } catch (error: any) {
    console.error('AGAVE invite accept error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error accepting invitation' },
      { status: 500 }
    );
  }
}
