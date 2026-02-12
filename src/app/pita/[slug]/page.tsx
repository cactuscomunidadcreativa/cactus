import { Metadata } from 'next';
import { PitaViewerClient } from './client';
import { OWN_YOUR_IMPACT_SECTIONS, OWN_YOUR_IMPACT_BRAND } from '@/modules/pita/lib/presentations';
import { createClient } from '@/lib/supabase/server';

// Static presentations map (fallback when not in DB)
const PRESENTATIONS: Record<string, {
  id: string;
  title: string;
  subtitle?: string;
  brandConfig: typeof OWN_YOUR_IMPACT_BRAND;
  sections: typeof OWN_YOUR_IMPACT_SECTIONS;
}> = {
  'own-your-impact': {
    id: 'own-your-impact-001',
    title: 'OWN YOUR IMPACT',
    subtitle: 'Be. Grow. Lead. — Elevate Your EQ. Transform Your Leadership.',
    brandConfig: OWN_YOUR_IMPACT_BRAND,
    sections: OWN_YOUR_IMPACT_SECTIONS,
  },
};

// Try to load from Supabase, fall back to static
async function loadPresentation(slug: string) {
  // Try Supabase first
  try {
    const supabase = await createClient();
    if (supabase) {
      const { data: dbPresentation } = await supabase
        .from('pita_presentations')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (dbPresentation) {
        const { data: dbSections } = await supabase
          .from('pita_sections')
          .select('*')
          .eq('presentation_id', dbPresentation.id)
          .order('order_index', { ascending: true });

        if (dbSections && dbSections.length > 0) {
          return {
            id: dbPresentation.id,
            title: dbPresentation.title,
            subtitle: dbPresentation.subtitle,
            brandConfig: dbPresentation.brand_config || OWN_YOUR_IMPACT_BRAND,
            sections: dbSections.map((s: any) => ({
              id: s.id,
              presentation_id: s.presentation_id,
              order_index: s.order_index,
              title: s.title,
              subtitle: s.subtitle,
              content: s.content,
              section_type: s.section_type,
              metadata: s.metadata,
              created_at: s.created_at,
            })),
            fromDB: true,
          };
        }
      }
    }
  } catch {
    // Fallback to static
  }

  // Static fallback
  const staticPres = PRESENTATIONS[slug];
  if (!staticPres) return null;

  return {
    ...staticPres,
    sections: staticPres.sections.map((section, i) => ({
      ...section,
      id: `${slug}-section-${i}`,
      presentation_id: staticPres.id,
      created_at: new Date().toISOString(),
    })),
    fromDB: false,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const presentation = await loadPresentation(slug);

  if (!presentation) {
    return { title: 'Presentation Not Found | PITA' };
  }

  return {
    title: `${presentation.title} | PITA`,
    description: presentation.subtitle,
    openGraph: {
      title: presentation.title,
      description: presentation.subtitle,
      type: 'website',
    },
  };
}

export default async function PitaPresentationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const presentation = await loadPresentation(slug);

  if (!presentation) {
    return (
      <div className="min-h-screen bg-[#0E1B2C] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-editorial font-bold text-[#F5F7F9] mb-4">
            Presentation Not Found
          </h1>
          <p className="text-[#F5F7F9]/50">This link may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <PitaViewerClient
      presentationId={presentation.id}
      slug={slug}
      title={presentation.title}
      subtitle={presentation.subtitle}
      sections={presentation.sections}
      brandConfig={presentation.brandConfig}
    />
  );
}
