import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { RamonaApp } from '@/modules/ramona';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function RamonaPage() {
  const supabase = await createClient();
  const t = await getTranslations('ramona');

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
    .eq('app_id', 'ramona')
    .in('status', ['active', 'trialing'])
    .limit(1)
    .single();

  if (!subscription) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-display font-bold mb-2">{t('noAccess')}</h2>
        <p className="text-muted-foreground mb-6">{t('noAccessDescription')}</p>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          {t('goToMarketplace')}
        </Link>
      </div>
    );
  }

  // Get content limit from tier
  let contentLimit = 100;
  if (subscription.tier_id) {
    const { data: tier } = await supabase
      .from('app_tiers')
      .select('limits')
      .eq('id', subscription.tier_id)
      .single();
    if (tier?.limits?.contents_per_month) {
      contentLimit = tier.limits.contents_per_month;
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <RamonaApp userId={user.id} contentLimit={contentLimit} />
    </div>
  );
}
