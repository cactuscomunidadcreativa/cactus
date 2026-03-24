import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AITrainingPage } from '@/modules/cereus/components/ai-training-page';

export default async function CereusAITrainingRoute() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="max-w-7xl mx-auto">
      <Suspense>
        <AITrainingPage />
      </Suspense>
    </div>
  );
}
