import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/pita/presentations — List all presentations for authenticated user
export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: presentations, error } = await supabase
    .from('pita_presentations')
    .select('*, pita_sections(count)')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ presentations: presentations || [] });
}

// POST /api/pita/presentations — Create new presentation
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, subtitle, slug, brand_config } = body;

  if (!title || !slug) {
    return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
  }

  // Validate slug format
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(slug)) {
    return NextResponse.json({ error: 'Slug must be lowercase with hyphens only' }, { status: 400 });
  }

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from('pita_presentations')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
  }

  const { data: presentation, error } = await supabase
    .from('pita_presentations')
    .insert({
      title,
      subtitle: subtitle || null,
      slug,
      brand_config: brand_config || {
        primaryColor: '#0E1B2C',
        secondaryColor: '#4FAF8F',
        accentColor: '#C7A54A',
        backgroundColor: '#FFFFFF',
        textColor: '#0E1B2C',
      },
      created_by: user.id,
      is_active: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ presentation, ok: true }, { status: 201 });
}
