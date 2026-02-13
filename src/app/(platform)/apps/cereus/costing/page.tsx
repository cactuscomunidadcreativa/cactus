import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { CereusCostingPage } from '@/modules/cereus/components/costing-page';

export default async function CereusCostingRoute() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .eq('app_id', 'cereus')
    .in('status', ['active', 'trialing'])
    .limit(1)
    .single();

  if (!subscription) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-display font-bold mb-2">Access Required</h2>
        <p className="text-muted-foreground mb-6">
          You need an active CEREUS subscription to access this page.
        </p>
        <Link href="/marketplace" className="inline-flex items-center gap-2 px-6 py-3 bg-cereus-gold text-white rounded-lg font-medium hover:bg-cereus-gold/90">
          View Plans
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Suspense>
        <CereusCostingPage />
      </Suspense>
    </div>
  );
}
