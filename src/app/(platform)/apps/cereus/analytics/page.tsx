import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { CereusAnalyticsDashboard } from '@/modules/cereus/components/analytics-dashboard';

export default async function CereusAnalyticsRoute() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="max-w-7xl mx-auto">
      <Suspense>
        <CereusAnalyticsDashboard />
      </Suspense>
    </div>
  );
}
