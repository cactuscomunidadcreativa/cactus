import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import { Store, ArrowRight } from 'lucide-react';

// Map app IDs to logo files in /public
const APP_LOGOS: Record<string, string> = {
  ramona: '/ramona.png',
  tuna: '/tuna.png',
  agave: '/agave.png',
  saguaro: '/saguaro.png',
  pita: '/pita.png',
};
import { StatsCards } from '@/components/dashboard/stats-cards';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { MoodChart } from '@/components/dashboard/mood-chart';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const t = await getTranslations('platform.dashboard');
  const supabase = await createClient();

  let profileName: string | null = null;
  let activeSubs: any[] = [];

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      profileName = profile?.full_name || null;

      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select(`
          app_id,
          status,
          current_period_end,
          apps (name, icon, color, description)
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing']);

      activeSubs = subscriptions || [];
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold">
          {profileName
            ? t('welcome', { name: profileName })
            : t('welcomeDefault')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8">
        <StatsCards />
      </div>

      {/* Active Apps */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">{t('activeApps')}</h2>

        {activeSubs.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">{t('noApps')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('noAppsDescription')}
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cactus-green text-white rounded-md text-sm font-medium hover:bg-cactus-green/90 transition-colors"
            >
              {t('exploreMarketplace')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeSubs.map((sub: any) => (
              <Link
                key={sub.app_id}
                href={`/apps/${sub.app_id}`}
                className="bg-card border border-border rounded-lg p-5 hover:border-cactus-green/50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  {APP_LOGOS[sub.app_id] ? (
                    <Image
                      src={APP_LOGOS[sub.app_id]}
                      alt={sub.apps?.name || sub.app_id}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-lg object-contain"
                    />
                  ) : (
                    <span
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{
                        backgroundColor: (sub.apps?.color || '#888') + '15',
                      }}
                    >
                      {sub.apps?.icon || '\uD83D\uDCE6'}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium group-hover:text-cactus-green transition-colors">
                      {sub.apps?.name || sub.app_id}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {sub.apps?.description || ''}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-cactus-green transition-colors mt-1" />
                </div>
                {sub.status === 'trialing' && (
                  <span className="inline-block mt-3 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">
                    Trial
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Activity Feed + Mood Chart */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">{t('recentActivity')}</h2>
          <ActivityFeed />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('moodTrend')}</h2>
          <MoodChart />
        </div>
      </div>
    </div>
  );
}
