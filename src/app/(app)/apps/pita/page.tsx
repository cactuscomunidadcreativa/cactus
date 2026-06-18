import { notFound, redirect } from 'next/navigation';
import { PitaApp } from '@/components/cactus/apps/pita/pita-app';
import { getAgent } from '@/lib/cactus/agents-catalog';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { getEffectiveAgentImages } from '@/lib/cactus/agent-images';
import { getAccessStatus } from '@/lib/cactus/access';
import { OWN_YOUR_IMPACT_SECTIONS, INCLUSION_BY_DESIGN_SECTIONS } from '@/modules/pita/lib/presentations';

export const metadata = { title: 'Pita · Presentaciones · Cactus' };

export interface PitaVaultItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  slides: number;
  editable: boolean;
}

export default async function PitaAppPage() {
  const agent = getAgent('pita');
  if (!agent) notFound();

  let image = agent.image;
  let user: { name: string; email?: string } | undefined;
  let credits: number | undefined;

  const vault: PitaVaultItem[] = [
    { id: 'own-your-impact-001', slug: 'own-your-impact', title: 'OWN YOUR IMPACT', subtitle: 'Be. Grow. Lead.', slides: OWN_YOUR_IMPACT_SECTIONS.length, editable: false },
    { id: 'inclusion-by-design-001', slug: 'inclusion-by-design', title: 'INCLUSION BY DESIGN', subtitle: 'Know. Choose. Give.', slides: INCLUSION_BY_DESIGN_SECTIONS.length, editable: false },
  ];

  const supabase = await createClient();
  if (supabase) {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) redirect('/login?redirect=/apps/pita');

    const companyId = await getActiveCompanyId(supabase, u.id);
    const images = await getEffectiveAgentImages(supabase, companyId);
    if (images[agent.slug]) image = images[agent.slug];

    const access = await getAccessStatus(supabase, u);
    credits = access.byok ? -1 : access.credits;

    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', u.id).maybeSingle();
    user = { name: profile?.full_name || u.email?.split('@')[0] || 'Tú', email: u.email ?? undefined };

    try {
      const { data } = await supabase
        .from('pita_presentations')
        .select('id, slug, title, subtitle, pita_sections(count)')
        .eq('created_by', u.id)
        .order('created_at', { ascending: false });
      for (const p of (data || []) as any[]) {
        vault.unshift({ id: p.id, slug: p.slug, title: p.title, subtitle: p.subtitle || '', slides: p.pita_sections?.[0]?.count || 0, editable: true });
      }
    } catch { /* tabla pita ausente → solo estáticas */ }
  }

  return (
    <PitaApp
      agent={{ slug: agent.slug, name: agent.name, role: agent.role, color: agent.color, image }}
      user={user}
      credits={credits}
      vault={vault}
    />
  );
}
