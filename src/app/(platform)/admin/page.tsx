import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminApp } from '@/modules/admin';
import { isSuperAdmin } from '@/lib/admin/auth';

export default async function AdminPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check super_admin (DB role o allowlist por ENV)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!isSuperAdmin(user.email, profile?.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <AdminApp />
    </div>
  );
}
