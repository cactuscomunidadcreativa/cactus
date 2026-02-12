import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// App names for messages
const APP_NAMES: Record<string, string> = {
  ramona: 'RAMONA',
  tuna: 'TUNA',
  saguaro: 'SAGUARO',
  agave: 'AGAVE',
};

// Invitation templates
const TEMPLATES = {
  es: {
    whatsapp: (params: { appName: string; clientName: string; userName: string; inviteUrl: string }) =>
      `*${params.appName} - Invitacion*\n\nHola ${params.userName}!\n\nHas sido invitado a usar ${params.appName} de ${params.clientName}.\n\nAccede aqui:\n${params.inviteUrl}\n\nPreguntas? Responde a este mensaje.`,
    email: {
      subject: (params: { appName: string; clientName: string }) => `Invitacion a ${params.appName} - ${params.clientName}`,
      body: (params: { appName: string; clientName: string; userName: string; inviteUrl: string }) =>
        `Hola ${params.userName},\n\nHas sido invitado a usar ${params.appName} de ${params.clientName}.\n\nPara acceder, haz clic en el siguiente enlace:\n${params.inviteUrl}\n\nSi tienes preguntas, contacta al administrador.\n\nSaludos,\nEquipo ${params.appName}`,
    },
  },
  en: {
    whatsapp: (params: { appName: string; clientName: string; userName: string; inviteUrl: string }) =>
      `*${params.appName} - Invitation*\n\nHi ${params.userName}!\n\nYou've been invited to use ${params.appName} for ${params.clientName}.\n\nAccess here:\n${params.inviteUrl}\n\nQuestions? Reply to this message.`,
    email: {
      subject: (params: { appName: string; clientName: string }) => `${params.appName} Invitation - ${params.clientName}`,
      body: (params: { appName: string; clientName: string; userName: string; inviteUrl: string }) =>
        `Hi ${params.userName},\n\nYou've been invited to use ${params.appName} for ${params.clientName}.\n\nTo access, click the following link:\n${params.inviteUrl}\n\nIf you have questions, contact the administrator.\n\nBest regards,\n${params.appName} Team`,
    },
  },
};

// Generate a secure invite token
function generateInviteToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// POST - Send invitation to a user
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
      appId,
      clientId,
      email,
      phone,
      nombreContacto,
      rol = 'user',
      idioma = 'es',
    } = body;

    if (!appId || !clientId) {
      return NextResponse.json({ error: 'App ID and Client ID are required' }, { status: 400 });
    }

    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone is required' }, { status: 400 });
    }

    // Get client info
    const { data: client } = await supabase
      .from('app_clients')
      .select('id, nombre, app_id')
      .eq('id', clientId)
      .single();

    if (!client || client.app_id !== appId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check if user already exists by email
    if (email) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingProfile) {
        // Check if already assigned to this client
        const { data: existingAssignment } = await supabase
          .from('app_client_users')
          .select('id')
          .eq('client_id', clientId)
          .eq('user_id', existingProfile.id)
          .single();

        if (existingAssignment) {
          return NextResponse.json({
            error: 'User already assigned to this client',
            alreadyAssigned: true,
          }, { status: 400 });
        }

        // Assign existing user to client
        const { error: assignError } = await supabase
          .from('app_client_users')
          .insert({
            client_id: clientId,
            user_id: existingProfile.id,
            nombre_contacto: nombreContacto,
            email,
            phone,
            rol,
          });

        if (assignError) throw assignError;

        return NextResponse.json({
          success: true,
          action: 'assigned',
          message: 'Existing user assigned to client',
          userId: existingProfile.id,
        });
      }
    }

    // Generate invitation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.example.com';
    const inviteToken = generateInviteToken();
    const inviteUrl = `${baseUrl}/register?invite=${inviteToken}&app=${appId}`;

    // Store invitation in database
    const { error: inviteError } = await supabase
      .from('app_invitations')
      .insert({
        token: inviteToken,
        app_id: appId,
        client_id: clientId,
        email,
        phone,
        nombre_contacto: nombreContacto,
        rol,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });

    if (inviteError) throw inviteError;

    // Prepare templates
    const appName = APP_NAMES[appId] || appId.toUpperCase();
    const lang = idioma === 'en' ? 'en' : 'es';
    const templates = TEMPLATES[lang];
    const templateParams = {
      appName,
      clientName: client.nombre,
      userName: nombreContacto || (email ? email.split('@')[0] : 'Usuario'),
      inviteUrl,
    };

    return NextResponse.json({
      success: true,
      action: 'invited',
      inviteUrl,
      inviteToken,
      whatsappTemplate: templates.whatsapp(templateParams),
      emailTemplate: {
        subject: templates.email.subject(templateParams),
        body: templates.email.body(templateParams),
      },
    });

  } catch (error: any) {
    console.error('App invite error:', error);
    return NextResponse.json(
      { error: error.message || 'Error sending invitation' },
      { status: 500 }
    );
  }
}

// GET - Get pending invitations for a client
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

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const appId = searchParams.get('appId');

    let query = supabase
      .from('app_invitations')
      .select('*')
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    if (appId) {
      query = query.eq('app_id', appId);
    }

    const { data: invitations, error } = await query;

    if (error) throw error;

    return NextResponse.json({ invitations: invitations || [] });

  } catch (error: any) {
    console.error('App invite GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching invitations' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel an invitation
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
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    await supabase
      .from('app_invitations')
      .delete()
      .eq('token', token);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('App invite DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Error canceling invitation' },
      { status: 500 }
    );
  }
}
