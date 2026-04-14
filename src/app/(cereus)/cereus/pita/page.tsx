import { createClient } from '@/lib/supabase/server'
import { OWN_YOUR_IMPACT_SECTIONS, INCLUSION_BY_DESIGN_SECTIONS } from '@/modules/pita/lib/presentations'
import { PitaDashboardView } from '@/app/(platform)/apps/pita/pita-dashboard-view'
import Image from 'next/image'

export default async function PitaRoute() {
  const supabase = await createClient()
  let dbPresentations: any[] = []

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('pita_presentations')
        .select('*, pita_sections(count)')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
      dbPresentations = data || []
    }
  }

  const staticPresentations = [
    { id: 'own-your-impact-001', slug: 'own-your-impact', title: 'OWN YOUR IMPACT', subtitle: 'Be. Grow. Lead.', slidesCount: OWN_YOUR_IMPACT_SECTIONS.length },
    { id: 'inclusion-by-design-001', slug: 'inclusion-by-design', title: 'INCLUSION BY DESIGN', subtitle: 'Know. Choose. Give.', slidesCount: INCLUSION_BY_DESIGN_SECTIONS.length },
  ]

  const dbSlugs = dbPresentations.map((p: any) => p.slug)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Image src="/pita.png" alt="PITA" width={32} height={32} className="opacity-80" />
        <div>
          <h1 className="text-lg font-display font-bold">PITA</h1>
          <p className="text-xs text-muted-foreground">Presentation & Co-Creation Vault</p>
        </div>
      </div>
      <PitaDashboardView
        dbPresentations={dbPresentations}
        staticPresentations={staticPresentations}
        dbSlugs={dbSlugs}
      />
    </div>
  )
}
