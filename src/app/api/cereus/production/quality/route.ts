import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/cereus/production/quality?maisonId=xxx&orderId=xxx
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const maisonId = searchParams.get('maisonId');
  const orderId = searchParams.get('orderId');
  if (!maisonId) return NextResponse.json({ error: 'maisonId required' }, { status: 400 });

  let query = db
    .from('cereus_quality_checks')
    .select('*, order:cereus_orders(id, order_number, variant:cereus_variants(id, variant_name, garment:cereus_garments(id, name)))')
    .eq('maison_id', maisonId)
    .order('created_at', { ascending: false });

  if (orderId) query = query.eq('order_id', orderId);

  const { data: checks, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ checks: checks || [] });
}

// POST /api/cereus/production/quality
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { maisonId, orderId, stage, checklist_items, notes, result } = body;

  if (!maisonId || !orderId || !checklist_items) {
    return NextResponse.json({ error: 'maisonId, orderId, and checklist_items required' }, { status: 400 });
  }

  const { data: check, error } = await db
    .from('cereus_quality_checks')
    .insert({
      maison_id: maisonId,
      order_id: orderId,
      stage: stage || 'calidad',
      checklist_items,
      notes: notes || null,
      result: result || 'pending',
      checked_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ check, success: true });
}

// PUT /api/cereus/production/quality
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { id, checklist_items, notes, result } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (checklist_items !== undefined) updates.checklist_items = checklist_items;
  if (notes !== undefined) updates.notes = notes;
  if (result !== undefined) updates.result = result;

  const { data: check, error } = await db
    .from('cereus_quality_checks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ check, success: true });
}
