import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Check if user has a linked phone
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: link } = await supabase
    .from('wa_phone_links')
    .select('phone, verified')
    .eq('user_id', user.id)
    .single();

  if (!link) {
    return NextResponse.json({ phone: null, verified: false });
  }

  return NextResponse.json({ phone: link.phone, verified: link.verified });
}

// POST: Link a phone number (sends verification code)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { phone } = body;
  if (!phone || typeof phone !== 'string' || phone.length < 8) {
    return NextResponse.json({ error: 'Valid phone number is required' }, { status: 400 });
  }

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Upsert phone link with verification code
  const { error: dbError } = await supabase
    .from('wa_phone_links')
    .upsert({
      user_id: user.id,
      phone: phone.trim(),
      verified: false,
      verification_code: code,
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (dbError) {
    // Check if phone is already taken by another user
    if (dbError.message.includes('unique') || dbError.message.includes('duplicate')) {
      return NextResponse.json({ error: 'Phone number already linked to another account' }, { status: 409 });
    }
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Send verification code via Twilio if configured, otherwise log (dev mode)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const { TwilioAdapter } = await import('@/lib/whatsapp/twilio-adapter');
    const adapter = new TwilioAdapter();
    const sent = await adapter.sendMessage(
      phone.trim(),
      `Tu codigo de verificacion Cactus es: ${code}`
    );
    if (!sent) {
      console.error(`[WhatsApp Link] Failed to send code to ${phone}`);
    }
  } else {
    console.log(`[WhatsApp Link] Verification code for ${phone}: ${code}`);
  }

  return NextResponse.json({ success: true, message: 'Verification code sent' });
}

// PUT: Verify the code
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { code } = body;
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
  }

  // Check the code
  const { data: link } = await supabase
    .from('wa_phone_links')
    .select('id, verification_code')
    .eq('user_id', user.id)
    .single();

  if (!link) {
    return NextResponse.json({ error: 'No pending verification found' }, { status: 404 });
  }

  if (link.verification_code !== code) {
    return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
  }

  // Mark as verified
  await supabase
    .from('wa_phone_links')
    .update({
      verified: true,
      verification_code: null,
      linked_at: new Date().toISOString(),
    })
    .eq('id', link.id);

  return NextResponse.json({ success: true, verified: true });
}

// DELETE: Unlink phone
export async function DELETE() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase
    .from('wa_phone_links')
    .delete()
    .eq('user_id', user.id);

  return NextResponse.json({ success: true });
}
