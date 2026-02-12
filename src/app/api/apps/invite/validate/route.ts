import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const APP_NAMES: Record<string, string> = {
  ramona: 'RAMONA',
  tuna: 'TUNA',
  saguaro: 'SAGUARO',
  agave: 'AGAVE',
};

// GET - Validate an invitation token
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ valid: false, error: 'Database connection error' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token is required' }, { status: 400 });
    }

    // Get invitation
    const { data: invitation } = await supabase
      .from('app_invitations')
      .select(`
        *,
        client:app_clients (
          id,
          nombre,
          app_id
        )
      `)
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (!invitation) {
      return NextResponse.json({ valid: false, error: 'Invitacion no encontrada' }, { status: 404 });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Invitacion expirada' }, { status: 400 });
    }

    const clientData = invitation.client as any;

    return NextResponse.json({
      valid: true,
      appId: invitation.app_id,
      appName: APP_NAMES[invitation.app_id] || invitation.app_id.toUpperCase(),
      clientId: clientData?.id,
      clientName: clientData?.nombre || 'Cliente',
      email: invitation.email,
      phone: invitation.phone,
      nombreContacto: invitation.nombre_contacto,
      rol: invitation.rol,
    });

  } catch (error: any) {
    console.error('App invite validate error:', error);
    return NextResponse.json(
      { valid: false, error: error.message || 'Error validating invitation' },
      { status: 500 }
    );
  }
}
