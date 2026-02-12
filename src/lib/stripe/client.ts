import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    });
  }
  return _stripe;
}

// Lazy proxy so imports don't fail at build time
export const stripe = new Proxy({} as Stripe, {
  get(_, prop: string) {
    return (getStripe() as any)[prop];
  },
});
