import { notFound, redirect } from 'next/navigation';
import { PitayaApp } from '@/components/cactus/apps/pitaya/pitaya-app';
import { getAgent } from '@/lib/cactus/agents-catalog';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { getEffectiveAgentImages } from '@/lib/cactus/agent-images';
import { getAccessStatus } from '@/lib/cactus/access';

export const metadata = { title: 'Pitaya · Copy Creativo · Cactus' };

export default async function PitayaAppPage() {
  const agent = getAgent('pitaya');
  if (!agent) notFound();

  let image = agent.image;
  let user: { name: string; email?: string } | undefined;
  let credits: number | undefined;

  const supabase = await createClient();
  if (supabase) {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) redirect('/login?redirect=/apps/pitaya');

    const companyId = await getActiveCompanyId(supabase, u.id);
    const images = await getEffectiveAgentImages(supabase, companyId);
    if (images[agent.slug]) image = images[agent.slug];

    const access = await getAccessStatus(supabase, u);
    if (!access.allowed) redirect('/packs'); // bloqueo visual: sin plan/créditos no se ve la app
    credits = access.byok ? -1 : access.credits;

    const { data: profile } = await supabase
      .from('profiles').select('full_name').eq('id', u.id).maybeSingle();
    user = { name: profile?.full_name || u.email?.split('@')[0] || 'Tú', email: u.email ?? undefined };
  }

  return (
    <PitayaApp
      agent={{ slug: agent.slug, name: agent.name, role: agent.role, color: agent.color, image }}
      user={user}
      credits={credits}
    />
  );
}
