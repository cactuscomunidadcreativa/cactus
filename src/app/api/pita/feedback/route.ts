import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { sectionId, reviewerId, reviewerName, reaction, comment } = await request.json();

    if (!sectionId || !reviewerName) {
      return NextResponse.json({ error: 'sectionId and reviewerName required' }, { status: 400 });
    }

    // Skip if no actual feedback
    if (!reaction && !comment) {
      return NextResponse.json({ ok: true });
    }

    const supabase = await createClient();
    if (!supabase) {
      // Dev mode
      return NextResponse.json({ ok: true, id: `dev_${Date.now()}` });
    }

    // Upsert: if reviewer already left feedback on this section, update it
    const { data: existing } = await supabase
      .from('pita_feedback')
      .select('id')
      .eq('section_id', sectionId)
      .eq('reviewer_id', reviewerId)
      .limit(1)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('pita_feedback')
        .update({ reaction, comment })
        .eq('id', existing.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, id: existing.id });
    }

    // Insert new
    const { data, error } = await supabase
      .from('pita_feedback')
      .insert({
        section_id: sectionId,
        reviewer_id: reviewerId,
        reviewer_name: reviewerName,
        reaction,
        comment,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const presentationId = searchParams.get('presentationId');

    if (!presentationId) {
      return NextResponse.json({ error: 'presentationId required' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ feedback: [], reviewers: [] });
    }

    // Get all sections for this presentation
    const { data: sections } = await supabase
      .from('pita_sections')
      .select('id')
      .eq('presentation_id', presentationId);

    const sectionIds = (sections || []).map(s => s.id);

    // Get feedback for these sections
    const { data: feedback } = await supabase
      .from('pita_feedback')
      .select('*')
      .in('section_id', sectionIds)
      .order('created_at', { ascending: false });

    // Get reviewers
    const { data: reviewers } = await supabase
      .from('pita_reviewers')
      .select('id, name, last_seen_at')
      .eq('presentation_id', presentationId)
      .order('last_seen_at', { ascending: false });

    return NextResponse.json({
      feedback: feedback || [],
      reviewers: reviewers || [],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
