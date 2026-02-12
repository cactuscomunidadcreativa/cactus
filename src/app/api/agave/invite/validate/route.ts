import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Get invitation from platform_config
    const { data: config } = await supabase
      .from('platform_config')
      .select('value')
      .eq('key', `agave_invite_${token}`)
      .single();

    if (!config) {
      return NextResponse.json({ valid: false, error: 'Invitacion no encontrada' }, { status: 404 });
    }

    const inviteData = JSON.parse(config.value);

    // Check if expired
    if (new Date(inviteData.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Invitacion expirada' }, { status: 400 });
    }

    // Get client name
    const { data: client } = await supabase
      .from('agave_clients')
      .select('nombre')
      .eq('id', inviteData.clientId)
      .single();

    return NextResponse.json({
      valid: true,
      clientId: inviteData.clientId,
      clientName: client?.nombre || 'Cliente AGAVE',
      email: inviteData.email,
      phone: inviteData.phone,
      nombreContacto: inviteData.nombreContacto,
      rol: inviteData.rol,
    });

  } catch (error: any) {
    console.error('AGAVE invite validate error:', error);
    return NextResponse.json(
      { valid: false, error: error.message || 'Error validating invitation' },
      { status: 500 }
    );
  }
}
