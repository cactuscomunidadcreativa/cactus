import { stripe } from '@/lib/stripe/client';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Use service role for webhook (no user session)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const appId = session.metadata?.app_id;
      const tierId = session.metadata?.tier_id;

      if (userId && appId) {
        await getSupabaseAdmin()
          .from('subscriptions')
          .upsert({
            user_id: userId,
            app_id: appId,
            tier_id: tierId,
            status: 'active',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }, {
            onConflict: 'user_id,app_id',
          });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as any;
      await getSupabaseAdmin()
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_start: subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000).toISOString()
            : null,
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
          cancel_at: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await getSupabaseAdmin()
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
