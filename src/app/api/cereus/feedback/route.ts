import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/cereus/feedback?entity_type=xxx&entity_id=xxx
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get('entity_type');
  const entityId = searchParams.get('entity_id');

  if (!entityType || !entityId) {
    return NextResponse.json({ error: 'entity_type and entity_id required' }, { status: 400 });
  }

  const { data: feedback, error } = await db
    .from('cereus_design_feedback')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('revision_round', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(feedback || []);
}

// POST /api/cereus/feedback — Create feedback + update variant status
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const {
    maison_id,
    entity_type,
    entity_id,
    author_id,
    author_name,
    author_role,
    content,
    image_urls,
    feedback_type,
    revision_round,
  } = body;

  if (!maison_id || !entity_type || !entity_id || !content || !feedback_type) {
    return NextResponse.json(
      { error: 'maison_id, entity_type, entity_id, content, and feedback_type are required' },
      { status: 400 }
    );
  }

  // Insert the feedback row
  const { data: feedback, error: insertError } = await db
    .from('cereus_design_feedback')
    .insert({
      maison_id,
      entity_type,
      entity_id,
      author_id: author_id || user.id,
      author_name: author_name || null,
      author_role: author_role || null,
      content,
      image_urls: image_urls || [],
      feedback_type,
      revision_round: revision_round || 1,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Update variant status based on feedback type
  if (entity_type === 'variant') {
    if (feedback_type === 'revision_request') {
      // Fetch current revision_count then increment
      const { data: variant, error: fetchError } = await db
        .from('cereus_variants')
        .select('revision_count')
        .eq('id', entity_id)
        .single();

      if (!fetchError && variant) {
        const newCount = (variant.revision_count || 0) + 1;
        await db
          .from('cereus_variants')
          .update({ status: 'draft', revision_count: newCount, updated_at: new Date().toISOString() })
          .eq('id', entity_id);
      }
    } else if (feedback_type === 'approval') {
      await db
        .from('cereus_variants')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', entity_id);
    }
  }

  return NextResponse.json({ feedback, success: true });
}
