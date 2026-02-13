import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Lock, Shirt } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function CereusClosetRoute() {
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
          <h1 className="text-2xl font-display font-bold">Digital Closet</h1>
          <p className="text-sm text-muted-foreground">Client wardrobe management</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <Shirt className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Digital Wardrobe</h3>
        <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
          The digital closet tracks each client&apos;s wardrobe — delivered pieces, favorite combinations,
          style evolution, and outfit planning. Items are added automatically when orders are delivered.
        </p>
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-8">
          <div className="p-4 bg-muted/50 rounded-xl text-center">
            <p className="text-2xl font-display font-bold">0</p>
            <p className="text-xs text-muted-foreground">Pieces</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-xl text-center">
            <p className="text-2xl font-display font-bold">0</p>
            <p className="text-xs text-muted-foreground">Outfits</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-xl text-center">
            <p className="text-2xl font-display font-bold">0</p>
            <p className="text-xs text-muted-foreground">Clients</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          Items will appear here as orders are delivered from the Production module.
        </p>
      </div>
    </div>
  );
}
