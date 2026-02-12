import { createClient } from '@/lib/supabase/server';
import { PitaDashboard } from '@/modules/pita/components/pita-dashboard';
import { OWN_YOUR_IMPACT_SECTIONS, INCLUSION_BY_DESIGN_SECTIONS } from '@/modules/pita/lib/presentations';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Pencil } from 'lucide-react';

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

  // Static presentations
  const staticPresentations = [
    { id: 'own-your-impact-001', slug: 'own-your-impact', title: 'OWN YOUR IMPACT', subtitle: 'Be. Grow. Lead.', sections: OWN_YOUR_IMPACT_SECTIONS },
    { id: 'inclusion-by-design-001', slug: 'inclusion-by-design', title: 'INCLUSION BY DESIGN', subtitle: 'Know. Choose. Give.', sections: INCLUSION_BY_DESIGN_SECTIONS },
  ];

  // Fall back to static presentations if no DB presentations
  const useStatic = dbPresentations.length === 0;
  const presentationId = useStatic ? staticPresentations[0].id : dbPresentations[0].id;
  const slug = useStatic ? staticPresentations[0].slug : dbPresentations[0].slug;
  const title = useStatic ? staticPresentations[0].title : dbPresentations[0].title;

  const sectionsWithIds = useStatic
    ? staticPresentations[0].sections.map((section, i) => ({
        ...section,
        id: `${slug}-section-${i}`,
        presentation_id: presentationId,
        created_at: new Date().toISOString(),
      }))
    : []; // DB presentations load sections via API in the dashboard

  // Try to fetch feedback from Supabase
  let feedbackData: any[] = [];
  let reviewers: any[] = [];

  if (supabase) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/pita/feedback?presentationId=${presentationId}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        feedbackData = data.feedback || [];
        reviewers = data.reviewers || [];
      }
    } catch {
      // Silently fail
    }
  }

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
        <div className="flex items-center gap-2">
          {/* Edit button (only for DB presentations) */}
          {!useStatic && dbPresentations[0] && (
            <Link
              href={`/apps/pita/editor/${dbPresentations[0].id}`}
              className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-all"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Link>
          )}
          <Link
            href={`/pita/${slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-pita-green text-white rounded-lg text-sm font-medium hover:bg-pita-green/90 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            View Presentation
          </Link>
        </div>
      </div>

      {/* Static Presentations */}
      {useStatic && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {staticPresentations.map((pres) => (
            <div
              key={pres.id}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-pita-green/30 transition-all"
            >
              <div>
                <p className="text-sm font-semibold">{pres.title}</p>
                <p className="text-xs text-muted-foreground">
                  /{pres.slug} · {pres.sections.length} slides
                  <span className="ml-1 text-pita-green">· Live</span>
                </p>
              </div>
              <Link
                href={`/pita/${pres.slug}`}
                target="_blank"
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* DB Presentations list (if multiple) */}
      {dbPresentations.length > 1 && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dbPresentations.map((pres: any) => (
            <div
              key={pres.id}
              className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
            >
              <div>
                <p className="text-sm font-medium">{pres.title}</p>
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
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Link>
                {pres.is_active && (
                  <Link
                    href={`/pita/${pres.slug}`}
                    target="_blank"
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Dashboard */}
      <PitaDashboard
        presentationId={presentationId}
        title={title}
        slug={slug}
        sections={useStatic ? sectionsWithIds : []}
        feedbackData={feedbackData}
        reviewers={reviewers}
      />
    </div>
  );
}
