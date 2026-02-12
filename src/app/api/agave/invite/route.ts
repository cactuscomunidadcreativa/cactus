import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TwilioAdapter } from '@/lib/whatsapp/twilio-adapter';

// Invitation templates
const TEMPLATES = {
  es: {
    whatsapp: (params: { clientName: string; userName: string; inviteUrl: string }) =>
      `🌵 *AGAVE - Invitación*\n\nHola ${params.userName}!\n\nHas sido invitado a usar AGAVE, el asistente de pricing de ${params.clientName}.\n\nAccede aquí:\n${params.inviteUrl}\n\n¿Tienes preguntas? Responde a este mensaje.`,
    email: {
      subject: (params: { clientName: string }) => `Invitación a AGAVE - ${params.clientName}`,
      body: (params: { clientName: string; userName: string; inviteUrl: string }) =>
        `Hola ${params.userName},\n\nHas sido invitado a usar AGAVE, el asistente de pricing de ${params.clientName}.\n\nPara acceder, haz clic en el siguiente enlace:\n${params.inviteUrl}\n\nSi tienes preguntas, contacta al administrador.\n\nSaludos,\nEquipo AGAVE`,
    },
  },
  en: {
    whatsapp: (params: { clientName: string; userName: string; inviteUrl: string }) =>
      `🌵 *AGAVE - Invitation*\n\nHi ${params.userName}!\n\nYou've been invited to use AGAVE, the pricing assistant for ${params.clientName}.\n\nAccess here:\n${params.inviteUrl}\n\nQuestions? Reply to this message.`,
    email: {
      subject: (params: { clientName: string }) => `AGAVE Invitation - ${params.clientName}`,
      body: (params: { clientName: string; userName: string; inviteUrl: string }) =>
        `Hi ${params.userName},\n\nYou've been invited to use AGAVE, the pricing assistant for ${params.clientName}.\n\nTo access, click the following link:\n${params.inviteUrl}\n\nIf you have questions, contact the administrator.\n\nBest regards,\nAGAVE Team`,
    },
  },
};

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
      clientId,
      email,
      phone,
      nombreContacto,
      rol = 'user',
      sendVia = 'link', // 'link' | 'email' | 'whatsapp' | 'both'
      idioma = 'es',
    } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone is required' }, { status: 400 });
    }

    // Get client info
    const { data: client } = await supabase
      .from('agave_clients')
      .select('id, nombre')
      .eq('id', clientId)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check if user already exists by email
    let existingUserId: string | null = null;
    if (email) {
      // Try to find user by email in auth.users via profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingProfile) {
        existingUserId = existingProfile.id;

        // Check if already assigned to this client
        const { data: existingAssignment } = await supabase
          .from('agave_client_users')
          .select('id')
          .eq('client_id', clientId)
          .eq('user_id', existingUserId)
          .single();

        if (existingAssignment) {
          return NextResponse.json({
            error: 'User already assigned to this client',
            alreadyAssigned: true,
          }, { status: 400 });
        }

        // Assign existing user to client
        const { error: assignError } = await supabase
          .from('agave_client_users')
          .insert({
            client_id: clientId,
            user_id: existingUserId,
            nombre_contacto: nombreContacto,
            rol,
          });

        if (assignError) throw assignError;

        return NextResponse.json({
          success: true,
          action: 'assigned',
          message: 'Existing user assigned to client',
          userId: existingUserId,
        });
      }
    }

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.example.com';
    const inviteToken = generateInviteToken();
    const inviteUrl = `${baseUrl}/register?invite=${inviteToken}&client=${clientId}`;

    // Store invitation in database
    // First, let's create an invitations table if it doesn't exist
    // For now, store in a simple way using platform_config or a new approach

    // Save invitation data (we'll use a simple approach with the client_users table)
    // Create a pending invitation record
    const invitationData = {
      token: inviteToken,
      clientId,
      email,
      phone,
      nombreContacto,
      rol,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    // Store invitation in platform_config (temporary solution)
    // In production, you'd have a dedicated invitations table
    await supabase.from('platform_config').upsert({
      key: `agave_invite_${inviteToken}`,
      value: JSON.stringify(invitationData),
      description: `AGAVE invitation for ${email || phone}`,
    });

    // Prepare response
    const result: any = {
      success: true,
      action: 'invited',
      inviteUrl,
      inviteToken,
      sentVia: [] as string[],
    };

    // Get templates
    const lang = idioma === 'en' ? 'en' : 'es';
    const templates = TEMPLATES[lang];
    const templateParams = {
      clientName: client.nombre,
      userName: nombreContacto || (email ? email.split('@')[0] : 'Usuario'),
      inviteUrl,
    };

    // Send via WhatsApp if requested and phone provided
    if ((sendVia === 'whatsapp' || sendVia === 'both') && phone) {
      try {
        const twilio = new TwilioAdapter();
        const whatsappMessage = templates.whatsapp(templateParams);
        const sent = await twilio.sendMessage(phone, whatsappMessage);

        if (sent) {
          result.sentVia.push('whatsapp');

          // Log the message
          await supabase.from('wa_messages').insert({
            phone,
            direction: 'outbound',
            content: whatsappMessage,
            module: 'agave',
            processed: true,
          });
        } else {
          result.whatsappError = 'Failed to send WhatsApp message. Check Twilio credentials.';
        }
      } catch (err: any) {
        result.whatsappError = err.message;
      }
    }

    // Send via Email if requested and email provided
    if ((sendVia === 'email' || sendVia === 'both') && email) {
      try {
        // Check if email service is configured
        const resendApiKey = process.env.RESEND_API_KEY;

        if (resendApiKey) {
          // Send via Resend
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || 'AGAVE <noreply@resend.dev>',
              to: email,
              subject: templates.email.subject(templateParams),
              text: templates.email.body(templateParams),
            }),
          });

          if (emailRes.ok) {
            result.sentVia.push('email');
          } else {
            const errorData = await emailRes.json().catch(() => ({}));
            result.emailError = errorData.message || 'Failed to send email';
          }
        } else {
          result.emailError = 'Email service not configured (RESEND_API_KEY missing)';
        }
      } catch (err: any) {
        result.emailError = err.message;
      }
    }

    // If only link was requested, just return the URL
    if (sendVia === 'link') {
      result.sentVia.push('link');
      result.message = 'Invitation link generated. Share it manually.';
    }

    // Include template message for manual sharing
    result.whatsappTemplate = templates.whatsapp(templateParams);
    result.emailTemplate = {
      subject: templates.email.subject(templateParams),
      body: templates.email.body(templateParams),
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('AGAVE invite error:', error);
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

    // Get invitations from platform_config
    const { data: invitations } = await supabase
      .from('platform_config')
      .select('key, value, created_at')
      .like('key', 'agave_invite_%');

    const parsed = (invitations || [])
      .map(inv => {
        try {
          const data = JSON.parse(inv.value);
          return {
            token: data.token,
            clientId: data.clientId,
            email: data.email,
            phone: data.phone,
            nombreContacto: data.nombreContacto,
            rol: data.rol,
            createdAt: data.createdAt,
            expiresAt: data.expiresAt,
          };
        } catch {
          return null;
        }
      })
      .filter(inv => inv !== null)
      .filter(inv => !clientId || inv?.clientId === clientId);

    return NextResponse.json({ invitations: parsed });

  } catch (error: any) {
    console.error('AGAVE invite GET error:', error);
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
      .from('platform_config')
      .delete()
      .eq('key', `agave_invite_${token}`);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('AGAVE invite DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Error canceling invitation' },
      { status: 500 }
    );
  }
}

// Generate a secure invite token
function generateInviteToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
