import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { WeekFlowApp } from '@/modules/weekflow';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function SaguaroPage() {
  const supabase = await createClient();
  const t = await getTranslations('weekflow');

  if (!supabase) {
    redirect('/login');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Check active subscription for saguaro (or legacy weekflow)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .or('app_id.eq.saguaro,app_id.eq.weekflow')
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
          href="/landing/saguaro"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          Ver SAGUARO
        </Link>
      </div>
    );
  }

  // Load team membership
  const { data: membership } = await supabase
    .from('wf_members')
    .select('team_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  const teamId = membership?.team_id || null;

  return (
    <div className="max-w-4xl mx-auto">
      <WeekFlowApp initialTeamId={teamId} />
    </div>
  );
}
