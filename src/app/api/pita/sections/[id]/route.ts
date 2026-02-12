import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper: verify section ownership through parent presentation
async function verifySectionOwnership(supabase: any, sectionId: string, userId: string) {
  const { data: section } = await supabase
    .from('pita_sections')
    .select('id, presentation_id')
    .eq('id', sectionId)
    .single();

  if (!section) return null;

  const { data: presentation } = await supabase
    .from('pita_presentations')
    .select('id')
    .eq('id', section.presentation_id)
    .eq('created_by', userId)
    .single();

  return presentation ? section : null;
}

// PUT /api/pita/sections/[id] — Update section
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

  const section = await verifySectionOwnership(supabase, id, user.id);
  if (!section) {
    return NextResponse.json({ error: 'Section not found' }, { status: 404 });
  }

  const body = await req.json();
  const updates: Record<string, any> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.subtitle !== undefined) updates.subtitle = body.subtitle;
  if (body.content !== undefined) updates.content = body.content;
  if (body.section_type !== undefined) updates.section_type = body.section_type;
  if (body.order_index !== undefined) updates.order_index = body.order_index;
  if (body.metadata !== undefined) updates.metadata = body.metadata;

  const { data: updated, error } = await supabase
    .from('pita_sections')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ section: updated, ok: true });
}

// DELETE /api/pita/sections/[id] — Delete section
export async function DELETE(
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

  const section = await verifySectionOwnership(supabase, id, user.id);
  if (!section) {
    return NextResponse.json({ error: 'Section not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('pita_sections')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
