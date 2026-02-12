import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appId, tierId, yearly } = await request.json();

    // Get tier info
    const { data: tier } = await supabase
      .from('app_tiers')
      .select('*')
      .eq('id', tierId)
      .single();

    if (!tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    const priceId = yearly ? tier.stripe_price_id_yearly : tier.stripe_price_id_monthly;

    // If no Stripe price ID configured yet, create subscription directly (dev mode)
    if (!priceId) {
      // Dev mode: create subscription without Stripe
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          app_id: appId,
          tier_id: tierId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, {
          onConflict: 'user_id,app_id',
        });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      });
    }

    // Production: create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace`,
      metadata: {
        user_id: user.id,
        app_id: appId,
        tier_id: tierId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
