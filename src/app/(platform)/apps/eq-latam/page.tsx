import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { redirect } from 'next/navigation';
import { EqDashboard } from '@/modules/eq-latam/components/eq-dashboard';

export default async function EqLatamPage() {
  const supabase = await createClient();

  if (!supabase) {
    redirect('/login');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Check active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, tier_id')
    .eq('user_id', user.id)
    .eq('app_id', 'eq-latam')
    .in('status', ['active', 'trialing'])
    .limit(1)
    .single();

  if (!subscription) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-display font-bold mb-2">Acceso Requerido</h2>
        <p className="text-muted-foreground mb-6">
          Necesitas una suscripcion activa a EQ LATAM Master Cost para acceder al sistema de pricing.
        </p>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 px-6 py-3 bg-eq-blue text-white rounded-lg font-medium hover:bg-eq-blue/90 transition-colors"
        >
          Ver Planes
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <EqDashboard />
    </div>
  );
}
