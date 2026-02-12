import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Subscribe to newsletter (public)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { email, name, interests, source = 'website' } = body;

    // Validate email
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('cms_newsletter_subscribers')
      .select('id, unsubscribed')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      if (existing.unsubscribed) {
        // Re-subscribe
        await supabase
          .from('cms_newsletter_subscribers')
          .update({
            unsubscribed: false,
            unsubscribed_at: null,
            interests: interests || [],
          })
          .eq('id', existing.id);

        return NextResponse.json({
          success: true,
          message: 'Te has re-suscrito exitosamente.',
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Ya estás suscrito a nuestro newsletter.',
      });
    }

    // New subscription
    const { error } = await supabase
      .from('cms_newsletter_subscribers')
      .insert({
        email: email.toLowerCase(),
        name,
        interests: interests || [],
        source,
      });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Te has suscrito exitosamente. ¡Gracias!',
    });
  } catch (error: any) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - List subscribers (admin only)
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  // Check admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const active = searchParams.get('active') !== 'false';

  try {
    let query = supabase
      .from('cms_newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (active) {
      query = query.eq('unsubscribed', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ subscribers: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Unsubscribe (public with email token)
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);

  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('cms_newsletter_subscribers')
      .update({
        unsubscribed: true,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('email', email.toLowerCase());

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Te has dado de baja exitosamente.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
