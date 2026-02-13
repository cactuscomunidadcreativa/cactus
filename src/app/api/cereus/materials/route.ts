import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/cereus/materials?maisonId=xxx
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const maisonId = searchParams.get('maisonId');
  const type = searchParams.get('type');
  const search = searchParams.get('search') || '';

  if (!maisonId) return NextResponse.json({ error: 'maisonId required' }, { status: 400 });

  let query = db
    .from('cereus_materials')
    .select('*', { count: 'exact' })
    .eq('maison_id', maisonId)
    .eq('activo', true)
    .order('name');

  if (type) query = query.eq('type', type);
  if (search) query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,supplier.ilike.%${search}%`);

  const { data: materials, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ materials: materials || [], total: count || 0 });
}

// POST /api/cereus/materials
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { maisonId, ...data } = body;

  if (!maisonId || !data.name || !data.type || data.unit_cost === undefined || !data.unit) {
    return NextResponse.json({ error: 'maisonId, name, type, unit_cost, and unit are required' }, { status: 400 });
  }

  const { data: material, error } = await db
    .from('cereus_materials')
    .insert({
      maison_id: maisonId,
      name: data.name,
      code: data.code || null,
      description: data.description || null,
      type: data.type,
      subtype: data.subtype || null,
      supplier: data.supplier || null,
      supplier_code: data.supplier_code || null,
      origin_country: data.origin_country || null,
      lead_time_days: data.lead_time_days || null,
      unit_cost: data.unit_cost,
      unit: data.unit,
      currency: data.currency || 'USD',
      min_order_qty: data.min_order_qty || null,
      width_cm: data.width_cm || null,
      weight_gsm: data.weight_gsm || null,
      composition: data.composition || null,
      care_instructions: data.care_instructions || null,
      color_hex: data.color_hex || null,
      current_stock: data.current_stock || 0,
      stock_unit: data.stock_unit || data.unit,
      tags: data.tags || [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ material, success: true });
}

// PUT /api/cereus/materials
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

  const { data: material, error } = await db
    .from('cereus_materials')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ material, success: true });
}
