import { Metadata } from 'next';
import { PitaViewerClient } from './client';
import { OWN_YOUR_IMPACT_SECTIONS, OWN_YOUR_IMPACT_BRAND } from '@/modules/pita/lib/presentations';

// Static presentations map (will move to Supabase later)
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const presentation = PRESENTATIONS[slug];

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
  const presentation = PRESENTATIONS[slug];

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

  // Generate stable IDs for sections
  const sectionsWithIds = presentation.sections.map((section, i) => ({
    ...section,
    id: `${slug}-section-${i}`,
    presentation_id: presentation.id,
    created_at: new Date().toISOString(),
  }));

  return (
    <PitaViewerClient
      presentationId={presentation.id}
      slug={slug}
      title={presentation.title}
      subtitle={presentation.subtitle}
      sections={sectionsWithIds}
      brandConfig={presentation.brandConfig}
    />
  );
}
