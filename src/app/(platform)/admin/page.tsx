import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminApp } from '@/modules/admin';

export default async function AdminPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check super_admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <AdminApp />
    </div>
  );
}
