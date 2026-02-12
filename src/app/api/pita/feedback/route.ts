import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Check if a string is a valid UUID
function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

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

    // If sectionId or reviewerId are not valid UUIDs, this is a static presentation.
    // The pita_feedback table has UUID foreign keys, so we can't insert non-UUID values.
    // Store feedback via pita_threads (which uses TEXT fields) as a flexible fallback.
    if (!isUUID(sectionId) || !isUUID(reviewerId || '')) {
      const feedbackContent = [
        reaction ? `[${reaction}]` : '',
        comment || '',
      ].filter(Boolean).join(' ');

      if (feedbackContent.trim()) {
        // Extract presentation ID from section ID (e.g., "own-your-impact-section-0" → "own-your-impact")
        const parts = sectionId.split('-section-');
        const presentationSlug = parts[0] || 'unknown';

        try {
          await supabase
            .from('pita_threads')
            .insert({
              section_id: sectionId,
              presentation_id: presentationSlug,
              reviewer_id: reviewerId || `anon_${Date.now()}`,
              reviewer_name: reviewerName,
              content: feedbackContent,
            });
        } catch {
          // If threads table also fails, just acknowledge
        }
      }

      return NextResponse.json({ ok: true, id: `static_${Date.now()}` });
    }

    // UUID-based: use the proper pita_feedback table
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
      console.error('Feedback insert error:', error.message);
      return NextResponse.json({ ok: true, id: `fallback_${Date.now()}` });
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

    // For static presentations (non-UUID IDs), fetch from pita_threads
    if (!isUUID(presentationId)) {
      // Threads store feedback for static presentations
      const { data: threads } = await supabase
        .from('pita_threads')
        .select('*')
        .like('presentation_id', `%${presentationId.split('-001')[0] || presentationId}%`)
        .order('created_at', { ascending: false });

      const feedback = (threads || []).map(t => ({
        id: t.id,
        section_id: t.section_id,
        reviewer_id: t.reviewer_id,
        reviewer_name: t.reviewer_name,
        reaction: t.content.match(/^\[(like|dislike|love)\]/)?.[1] || null,
        comment: t.content.replace(/^\[(like|dislike|love)\]\s*/, '').trim() || null,
        created_at: t.created_at,
      }));

      // Get unique reviewer names
      const namesSet = new Set<string>();
      (threads || []).forEach(t => namesSet.add(t.reviewer_name));
      const uniqueReviewers = Array.from(namesSet).map(name => ({
        id: `static_${name}`,
        name,
        last_seen_at: new Date().toISOString(),
      }));

      return NextResponse.json({ feedback, reviewers: uniqueReviewers });
    }

    // UUID-based: use proper tables
    const { data: sections } = await supabase
      .from('pita_sections')
      .select('id')
      .eq('presentation_id', presentationId);

    const sectionIds = (sections || []).map(s => s.id);

    if (sectionIds.length === 0) {
      return NextResponse.json({ feedback: [], reviewers: [] });
    }

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
