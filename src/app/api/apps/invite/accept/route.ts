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

    // Get invitation
    const { data: invitation } = await supabase
      .from('app_invitations')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Invitacion no encontrada' }, { status: 404 });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'Invitacion expirada' }, { status: 400 });
    }

    // Check if user is already assigned to this client
    const { data: existingAssignment } = await supabase
      .from('app_client_users')
      .select('id')
      .eq('client_id', invitation.client_id)
      .eq('user_id', userId)
      .single();

    if (existingAssignment) {
      // Mark invitation as used
      await supabase
        .from('app_invitations')
        .update({ used_at: new Date().toISOString(), used_by: userId })
        .eq('token', token);

      return NextResponse.json({
        success: true,
        message: 'Usuario ya asignado al cliente',
        appId: invitation.app_id,
        clientId: invitation.client_id,
      });
    }

    // Assign user to client
    const { error: assignError } = await supabase
      .from('app_client_users')
      .insert({
        client_id: invitation.client_id,
        user_id: userId,
        nombre_contacto: invitation.nombre_contacto,
        email: invitation.email,
        phone: invitation.phone,
        rol: invitation.rol || 'user',
        activo: true,
      });

    if (assignError) {
      console.error('Error assigning user:', assignError);
      return NextResponse.json({ success: false, error: 'Error asignando usuario' }, { status: 500 });
    }

    // Mark invitation as used
    await supabase
      .from('app_invitations')
      .update({ used_at: new Date().toISOString(), used_by: userId })
      .eq('token', token);

    return NextResponse.json({
      success: true,
      message: 'Usuario asignado exitosamente',
      appId: invitation.app_id,
      clientId: invitation.client_id,
    });

  } catch (error: any) {
    console.error('App invite accept error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error accepting invitation' },
      { status: 500 }
    );
  }
}
