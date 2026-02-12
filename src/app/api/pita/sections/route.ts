import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/pita/sections — Create new section
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
  const { presentation_id, title, subtitle, content, section_type, order_index, metadata } = body;

  if (!presentation_id || !title) {
    return NextResponse.json({ error: 'presentation_id and title are required' }, { status: 400 });
  }

  // Verify presentation ownership
  const { data: presentation } = await supabase
    .from('pita_presentations')
    .select('id')
    .eq('id', presentation_id)
    .eq('created_by', user.id)
    .single();

  if (!presentation) {
    return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
  }

  const { data: section, error } = await supabase
    .from('pita_sections')
    .insert({
      presentation_id,
      title,
      subtitle: subtitle || null,
      content: content || '<div class="py-20 text-center"><h2 class="text-3xl font-display font-bold">New Section</h2></div>',
      section_type: section_type || 'content',
      order_index: order_index ?? 0,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ section, ok: true }, { status: 201 });
}
