import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/cereus/collections?maisonId=xxx
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const maisonId = searchParams.get('maisonId');
  if (!maisonId) return NextResponse.json({ error: 'maisonId required' }, { status: 400 });

  const { data: collections, error } = await db
    .from('cereus_collections')
    .select('*')
    .eq('maison_id', maisonId)
    .order('year', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collections: collections || [] });
}

// POST /api/cereus/collections
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { maisonId, ...data } = body;

  if (!maisonId || !data.name || !data.season || !data.year) {
    return NextResponse.json({ error: 'maisonId, name, season, and year required' }, { status: 400 });
  }

  const { data: collection, error } = await db
    .from('cereus_collections')
    .insert({
      maison_id: maisonId,
      designer_id: user.id,
      name: data.name,
      code: data.code || null,
      description: data.description || null,
      season: data.season,
      year: data.year,
      status: 'concept',
      target_pieces: data.target_pieces || null,
      target_revenue: data.target_revenue || null,
      avg_price_point: data.avg_price_point || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collection, success: true });
}

// PUT /api/cereus/collections — Update collection
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Valid status transitions
  const STATUS_FLOW: Record<string, string[]> = {
    concept: ['design', 'archived'],
    design: ['concept', 'production', 'archived'],
    production: ['design', 'launched', 'archived'],
    launched: ['archived'],
    archived: ['concept'],
  };

  // If status change, validate transition
  if (updates.status) {
    const { data: current } = await db
      .from('cereus_collections')
      .select('status')
      .eq('id', id)
      .single();

    if (current && !STATUS_FLOW[current.status]?.includes(updates.status)) {
      return NextResponse.json({
        error: `Cannot transition from ${current.status} to ${updates.status}`,
      }, { status: 400 });
    }

    // When launching, generate a unique lookbook code
    if (updates.status === 'launched' && current?.status !== 'launched') {
      const { data: collection } = await db
        .from('cereus_collections')
        .select('name, season, year, code')
        .eq('id', id)
        .single();

      if (collection) {
        const base = (collection.code || collection.name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const suffix = `${collection.season?.substring(0, 2) || 'xx'}${String(collection.year).slice(-2)}`;
        const random = Math.random().toString(36).substring(2, 6);
        updates.lookbook_code = `${base}-${suffix}-${random}`;
      }
    }
  }

  // Build update object with only allowed fields
  const allowedFields: Record<string, unknown> = {};
  const UPDATABLE = [
    'name', 'code', 'description', 'status', 'season', 'year',
    'cover_image_url', 'mood_board_urls', 'inspiration_notes',
    'target_pieces', 'target_revenue', 'avg_price_point', 'lookbook_code',
  ];

  for (const key of UPDATABLE) {
    if (updates[key] !== undefined) {
      allowedFields[key] = updates[key];
    }
  }

  allowedFields.updated_at = new Date().toISOString();

  const { data: collection, error } = await db
    .from('cereus_collections')
    .update(allowedFields)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collection, success: true });
}
