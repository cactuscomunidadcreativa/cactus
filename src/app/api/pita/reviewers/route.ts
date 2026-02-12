import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { presentationId, name } = await request.json();

    if (!name || !presentationId) {
      return NextResponse.json({ error: 'Name and presentationId required' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      // Dev mode: return mock ID
      return NextResponse.json({ id: `dev_${Date.now()}`, name });
    }

    // Check if reviewer already exists with this name for this presentation
    const { data: existing } = await supabase
      .from('pita_reviewers')
      .select('id')
      .eq('presentation_id', presentationId)
      .eq('name', name)
      .limit(1)
      .single();

    if (existing) {
      // Update last seen
      await supabase
        .from('pita_reviewers')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', existing.id);

      return NextResponse.json({ id: existing.id, name });
    }

    // Create new reviewer
    const sessionToken = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const { data, error } = await supabase
      .from('pita_reviewers')
      .insert({
        presentation_id: presentationId,
        name,
        session_token: sessionToken,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, name });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
