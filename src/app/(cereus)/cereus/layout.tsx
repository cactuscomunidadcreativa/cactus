import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CereusShell } from '@/modules/cereus/components/cereus-shell'

export const metadata = {
  title: 'CEREUS Atelier',
  description: 'The First Emotional Algorithmic Atelier',
}

export default async function CereusLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  if (!supabase) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/cereus')

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .eq('app_id', 'cereus')
    .in('status', ['active', 'trialing'])
    .limit(1)
    .single()

  if (!subscription) redirect('/marketplace')

  return <CereusShell>{children}</CereusShell>
}
