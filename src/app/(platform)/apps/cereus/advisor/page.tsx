import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Lock, Brain, Sparkles } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function CereusAdvisorRoute() {
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
        <p className="text-muted-foreground mb-6">You need an active CEREUS subscription to access this page.</p>
        <Link href="/marketplace" className="inline-flex items-center gap-2 px-6 py-3 bg-cereus-gold text-white rounded-lg font-medium hover:bg-cereus-gold/90">View Plans</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/apps/cereus" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold">AI Advisor</h1>
          <p className="text-sm text-muted-foreground">Emotional intelligence & style recommendations</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-cereus-gold/10 flex items-center justify-center mx-auto mb-6">
          <Brain className="w-10 h-10 text-cereus-gold" />
        </div>
        <h3 className="text-lg font-medium mb-2">CEREUS AI Advisor</h3>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          The AI Advisor uses emotional profiles, body measurements, wardrobe history, and fashion intelligence
          to provide personalized style recommendations and collection planning insights.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="p-5 bg-muted/50 rounded-xl text-left">
            <Sparkles className="w-6 h-6 text-cereus-gold mb-3" />
            <h4 className="font-medium text-sm mb-1">Style Recommendations</h4>
            <p className="text-xs text-muted-foreground">
              AI-powered suggestions based on emotional archetype, body shape, and personal style evolution.
            </p>
          </div>
          <div className="p-5 bg-muted/50 rounded-xl text-left">
            <Brain className="w-6 h-6 text-cereus-bordeaux mb-3" />
            <h4 className="font-medium text-sm mb-1">Emotional Analysis</h4>
            <p className="text-xs text-muted-foreground">
              Photo analysis with AI to understand style preferences, color affinities, and aesthetic sensibility.
            </p>
          </div>
          <div className="p-5 bg-muted/50 rounded-xl text-left">
            <svg className="w-6 h-6 text-emerald-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <h4 className="font-medium text-sm mb-1">Collection Planning</h4>
            <p className="text-xs text-muted-foreground">
              Market trends, margin optimization, and demand forecasting for seasonal collections.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-8">
          AI features activate when clients have emotional profiles and measurement data.
        </p>
      </div>
    </div>
  );
}
