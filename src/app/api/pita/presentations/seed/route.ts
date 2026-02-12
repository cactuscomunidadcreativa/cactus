import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  OWN_YOUR_IMPACT_SECTIONS,
  OWN_YOUR_IMPACT_BRAND,
  INCLUSION_BY_DESIGN_SECTIONS,
  INCLUSION_BY_DESIGN_BRAND,
} from '@/modules/pita/lib/presentations';

// Static presentations registry
const STATIC_PRESENTATIONS: Record<string, {
  title: string;
  subtitle: string;
  slug: string;
  brand: typeof OWN_YOUR_IMPACT_BRAND;
  sections: typeof OWN_YOUR_IMPACT_SECTIONS;
}> = {
  'own-your-impact': {
    title: 'OWN YOUR IMPACT',
    subtitle: 'Be. Grow. Lead. — Elevate Your EQ. Transform Your Leadership.',
    slug: 'own-your-impact',
    brand: OWN_YOUR_IMPACT_BRAND,
    sections: OWN_YOUR_IMPACT_SECTIONS,
  },
  'inclusion-by-design': {
    title: 'INCLUSION BY DESIGN',
    subtitle: 'Know. Choose. Give. — Diversa Peru × Six Seconds Official Certification Pathway.',
    slug: 'inclusion-by-design',
    brand: INCLUSION_BY_DESIGN_BRAND,
    sections: INCLUSION_BY_DESIGN_SECTIONS,
  },
};

// POST /api/pita/presentations/seed — Import a static presentation into the database
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await req.json();

  if (!slug || !STATIC_PRESENTATIONS[slug]) {
    return NextResponse.json(
      { error: `Invalid slug. Available: ${Object.keys(STATIC_PRESENTATIONS).join(', ')}` },
      { status: 400 }
    );
  }

  const staticPres = STATIC_PRESENTATIONS[slug];

  // Check if already seeded
  const { data: existing } = await supabase
    .from('pita_presentations')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    return NextResponse.json({
      ok: true,
      presentation: existing,
      message: 'Already seeded',
      alreadyExists: true,
    });
  }

  // Create the presentation
  const { data: presentation, error: presError } = await supabase
    .from('pita_presentations')
    .insert({
      title: staticPres.title,
      subtitle: staticPres.subtitle,
      slug: staticPres.slug,
      brand_config: staticPres.brand,
      created_by: user.id,
      is_active: true,
    })
    .select()
    .single();

  if (presError) {
    return NextResponse.json({ error: presError.message }, { status: 500 });
  }

  // Insert all sections
  const sectionsToInsert = staticPres.sections.map((section) => ({
    presentation_id: presentation.id,
    order_index: section.order_index,
    title: section.title,
    subtitle: section.subtitle || null,
    content: section.content,
    section_type: section.section_type,
    metadata: section.metadata || {},
  }));

  const { error: sectionsError } = await supabase
    .from('pita_sections')
    .insert(sectionsToInsert);

  if (sectionsError) {
    // Rollback: delete the presentation
    await supabase.from('pita_presentations').delete().eq('id', presentation.id);
    return NextResponse.json({ error: `Sections failed: ${sectionsError.message}` }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    presentation,
    sectionsCount: sectionsToInsert.length,
    message: `Imported "${staticPres.title}" with ${sectionsToInsert.length} slides`,
  }, { status: 201 });
}
