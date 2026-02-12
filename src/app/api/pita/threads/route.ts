import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { presentationId, sectionId, reviewerId, reviewerName, content, parentId } = await request.json();

    if (!sectionId || !reviewerName || !content?.trim()) {
      return NextResponse.json({ error: 'sectionId, reviewerName, and content required' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      // Dev mode: return mock thread
      const mockThread = {
        id: `dev_${Date.now()}`,
        section_id: sectionId,
        presentation_id: presentationId,
        reviewer_id: reviewerId || `dev_reviewer_${Date.now()}`,
        reviewer_name: reviewerName,
        parent_id: parentId || null,
        content: content.trim(),
        created_at: new Date().toISOString(),
      };
      return NextResponse.json({ ok: true, thread: mockThread });
    }

    const { data, error } = await supabase
      .from('pita_threads')
      .insert({
        section_id: sectionId,
        presentation_id: presentationId,
        reviewer_id: reviewerId || `anon_${Date.now()}`,
        reviewer_name: reviewerName,
        parent_id: parentId || null,
        content: content.trim(),
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, thread: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const presentationId = searchParams.get('presentationId');
    const sectionId = searchParams.get('sectionId');

    if (!presentationId) {
      return NextResponse.json({ error: 'presentationId required' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ threads: [] });
    }

    let query = supabase
      .from('pita_threads')
      .select('*')
      .eq('presentation_id', presentationId)
      .order('created_at', { ascending: true });

    if (sectionId) {
      query = query.eq('section_id', sectionId);
    }

    const { data: threads, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Nest replies under parent threads
    const topLevel = (threads || []).filter(t => !t.parent_id);
    const replies = (threads || []).filter(t => t.parent_id);

    const nested = topLevel.map(thread => ({
      ...thread,
      replies: replies.filter(r => r.parent_id === thread.id),
    }));

    return NextResponse.json({ threads: nested });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
