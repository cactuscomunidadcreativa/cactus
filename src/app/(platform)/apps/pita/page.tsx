import { createClient } from '@/lib/supabase/server';
import { OWN_YOUR_IMPACT_SECTIONS, INCLUSION_BY_DESIGN_SECTIONS } from '@/modules/pita/lib/presentations';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Pencil } from 'lucide-react';
import { PitaDashboardClient } from './dashboard-client';

export default async function PitaPage() {
  const supabase = await createClient();

  // Try to load presentations from Supabase
  let dbPresentations: any[] = [];

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from('pita_presentations')
        .select('*, pita_sections(count)')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      dbPresentations = data || [];
    }
  }

  // Static presentations (always available)
  const staticPresentations = [
    { id: 'own-your-impact-001', slug: 'own-your-impact', title: 'OWN YOUR IMPACT', subtitle: 'Be. Grow. Lead.', slidesCount: OWN_YOUR_IMPACT_SECTIONS.length },
    { id: 'inclusion-by-design-001', slug: 'inclusion-by-design', title: 'INCLUSION BY DESIGN', subtitle: 'Know. Choose. Give.', slidesCount: INCLUSION_BY_DESIGN_SECTIONS.length },
  ];

  // Check which static presentations are already in DB
  const dbSlugs = dbPresentations.map((p: any) => p.slug);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/pita.png" alt="PITA" width={32} height={32} className="opacity-80" />
          <div>
            <h1 className="text-lg font-display font-bold">PITA</h1>
            <p className="text-xs text-muted-foreground">Presentation & Co-Creation Vault</p>
          </div>
        </div>
      </div>

      {/* All Presentations */}
      <div className="mb-6 space-y-3">
        <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Presentations</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* DB Presentations */}
          {dbPresentations.map((pres: any) => (
            <div
              key={pres.id}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-pita-green/30 transition-all"
            >
              <div>
                <p className="text-sm font-semibold">{pres.title}</p>
                <p className="text-xs text-muted-foreground">
                  /{pres.slug} · {pres.pita_sections?.[0]?.count || 0} slides
                  {pres.is_active ? (
                    <span className="ml-1 text-pita-green">· Live</span>
                  ) : (
                    <span className="ml-1 text-amber-500">· Draft</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/apps/pita/editor/${pres.id}`}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                {pres.is_active && (
                  <Link
                    href={`/pita/${pres.slug}`}
                    target="_blank"
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="View"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          ))}

          {/* Static Presentations (not yet in DB) */}
          {staticPresentations
            .filter(sp => !dbSlugs.includes(sp.slug))
            .map((pres) => (
              <PitaDashboardClient key={pres.id} presentation={pres} />
            ))
          }
        </div>
      </div>
    </div>
  );
}
