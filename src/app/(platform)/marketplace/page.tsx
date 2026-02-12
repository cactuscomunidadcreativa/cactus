import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { MarketplaceClient } from '@/components/marketplace/marketplace-client';

export const metadata = { title: 'Marketplace' };

export default async function MarketplacePage() {
  const t = await getTranslations('marketplace');
  const supabase = await createClient();

  let apps: any[] = [];
  const userSubs: Record<string, any> = {};

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch all apps with their tiers
    const { data: appsData } = await supabase
      .from('apps')
      .select(`
        *,
        app_tiers (*)
      `)
      .order('sort_order');

    apps = appsData || [];

    // Fetch user's subscriptions
    if (user) {
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('app_id, status, tier_id')
        .eq('user_id', user.id);

      (subscriptions || []).forEach((s: any) => {
        userSubs[s.app_id] = s;
      });
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      <MarketplaceClient apps={apps} userSubs={userSubs} />
    </div>
  );
}
