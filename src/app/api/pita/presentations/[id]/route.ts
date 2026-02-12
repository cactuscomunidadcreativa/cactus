import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/pita/presentations/[id] — Get presentation with sections
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: presentation, error } = await supabase
    .from('pita_presentations')
    .select('*')
    .eq('id', id)
    .eq('created_by', user.id)
    .single();

  if (error || !presentation) {
    return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
  }

  const { data: sections } = await supabase
    .from('pita_sections')
    .select('*')
    .eq('presentation_id', id)
    .order('order_index', { ascending: true });

  return NextResponse.json({
    presentation,
    sections: sections || [],
  });
}

// PUT /api/pita/presentations/[id] — Update presentation metadata
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('pita_presentations')
    .select('id')
    .eq('id', id)
    .eq('created_by', user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
  }

  const body = await req.json();
  const { title, subtitle, slug, brand_config, is_active } = body;

  // If slug is changing, validate uniqueness
  if (slug) {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json({ error: 'Slug must be lowercase with hyphens only' }, { status: 400 });
    }

    const { data: slugExists } = await supabase
      .from('pita_presentations')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .single();

    if (slugExists) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 });
    }
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title;
  if (subtitle !== undefined) updates.subtitle = subtitle;
  if (slug !== undefined) updates.slug = slug;
  if (brand_config !== undefined) updates.brand_config = brand_config;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data: presentation, error } = await supabase
    .from('pita_presentations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ presentation, ok: true });
}
