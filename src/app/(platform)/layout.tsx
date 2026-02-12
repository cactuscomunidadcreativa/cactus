import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PlatformShell } from '@/components/layout/platform-shell';

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  if (!supabase) {
    // Supabase not configured — show shell with no user data for dev
    return (
      <PlatformShell
        userName="Dev User"
        userEmail="dev@localhost"
        subscriptions={[]}
        isAdmin={false}
      >
        {children}
      </PlatformShell>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, language, role')
    .eq('id', user.id)
    .single();

  // Fetch user subscriptions with app info
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select(`
      app_id,
      status,
      apps (name, icon, color)
    `)
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing']);

  const formattedSubs = (subscriptions || []).map((sub: any) => ({
    app_id: sub.app_id,
    app_name: sub.apps?.name || sub.app_id,
    app_icon: sub.apps?.icon || '📦',
    app_color: sub.apps?.color || '#888',
    status: sub.status,
  }));

  const isAdmin = profile?.role === 'super_admin';

  return (
    <PlatformShell
      userName={profile?.full_name}
      userEmail={user.email}
      subscriptions={formattedSubs}
      isAdmin={isAdmin}
    >
      {children}
    </PlatformShell>
  );
}
