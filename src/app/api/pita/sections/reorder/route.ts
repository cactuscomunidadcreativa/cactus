import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PUT /api/pita/sections/reorder — Batch-update order_index for sections
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { presentation_id, order } = body;

  if (!presentation_id || !Array.isArray(order)) {
    return NextResponse.json({ error: 'presentation_id and order array are required' }, { status: 400 });
  }

  // Verify ownership
  const { data: presentation } = await supabase
    .from('pita_presentations')
    .select('id')
    .eq('id', presentation_id)
    .eq('created_by', user.id)
    .single();

  if (!presentation) {
    return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
  }

  // Batch update order_index for each section
  const updates = order.map((item: { id: string; order_index: number }) =>
    supabase
      .from('pita_sections')
      .update({ order_index: item.order_index })
      .eq('id', item.id)
      .eq('presentation_id', presentation_id)
  );

  const results = await Promise.all(updates);
  const errors = results.filter(r => r.error);

  if (errors.length > 0) {
    return NextResponse.json({ error: 'Some updates failed', details: errors.map(e => e.error?.message) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
