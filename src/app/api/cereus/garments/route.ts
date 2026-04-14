import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/cereus/garments?maisonId=xxx
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const maisonId = searchParams.get('maisonId');
  const collectionId = searchParams.get('collectionId');

  if (!maisonId) return NextResponse.json({ error: 'maisonId required' }, { status: 400 });

  let query = db
    .from('cereus_garments')
    .select('*, collection:cereus_collections(id, name, code), garment_materials:cereus_garment_materials(id, material:cereus_materials(id, name, type, unit_cost, unit), quantity, unit, waste_factor, unit_cost, total_cost, notes)', { count: 'exact' })
    .eq('maison_id', maisonId)
    .order('created_at', { ascending: false });

  if (collectionId) query = query.eq('collection_id', collectionId);

  const { data: garments, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ garments: garments || [], total: count || 0 });
}

// POST /api/cereus/garments
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { maisonId, ...data } = body;

  if (!maisonId || !data.name || !data.category) {
    return NextResponse.json({ error: 'maisonId, name, and category required' }, { status: 400 });
  }

  const { data: garment, error } = await db
    .from('cereus_garments')
    .insert({
      maison_id: maisonId,
      collection_id: data.collection_id || null,
      designer_id: user.id,
      name: data.name,
      code: data.code || null,
      description: data.description || null,
      category: data.category,
      body_zone: data.body_zone || 'full',
      base_labor_hours: data.base_labor_hours || 0,
      base_labor_cost: data.base_labor_cost || 0,
      complexity_level: data.complexity_level || 1,
      base_price: data.base_price || null,
      margin_target: data.margin_target || 0.50,
      status: 'draft',
      tags: data.tags || [],
      season: data.season || null,
      year: data.year || null,
      images: data.images || [],
      design_brief: data.design_brief || null,
      brief_approved: data.brief_approved || false,
      sketch_source: data.sketch_source || null,
      pattern_data: data.pattern_data || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ garment, success: true });
}

// PUT /api/cereus/garments
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

  // Filter to only known columns
  const safeUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const SAFE_COLS = ['name', 'code', 'description', 'category', 'body_zone', 'base_labor_hours',
    'base_labor_cost', 'complexity_level', 'base_price', 'margin_target', 'status', 'tags',
    'season', 'year', 'images', 'collection_id', 'tech_sheet_url', 'pattern_url', 'base_cost',
    'design_brief', 'brief_approved', 'sketch_source', 'pattern_data'];
  for (const key of SAFE_COLS) {
    if (key in updates) safeUpdates[key] = updates[key];
  }

  const { data: garment, error } = await db
    .from('cereus_garments')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ garment, success: true });
}

// DELETE /api/cereus/garments?id=xxx — hard delete garment + related data
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Delete related data first
  await db.from('cereus_variants').delete().eq('garment_id', id);
  await db.from('cereus_garment_materials').delete().eq('garment_id', id);
  const { error } = await db.from('cereus_garments').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
