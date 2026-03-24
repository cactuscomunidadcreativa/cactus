import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/cereus/orders?maisonId=xxx
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

  const { data: orders, error } = await db
    .from('cereus_orders')
    .select('*, client:cereus_clients(id, full_name, vip_tier), variant:cereus_variants(id, variant_name, garment:cereus_garments(id, name, code)), workshop:cereus_workshops(id, name)')
    .eq('maison_id', maisonId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: orders || [] });
}

// POST /api/cereus/orders
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { maisonId, ...data } = body;

  if (!maisonId || !data.variant_id) {
    return NextResponse.json({ error: 'maisonId and variant_id required' }, { status: 400 });
  }

  // Generate order number
  const { count } = await db
    .from('cereus_orders')
    .select('*', { count: 'exact', head: true })
    .eq('maison_id', maisonId);
  const orderNum = `PV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;

  const finalAmount = (data.total_price || 0) - (data.discount_amount || 0);

  const { data: order, error } = await db
    .from('cereus_orders')
    .insert({
      maison_id: maisonId,
      client_id: data.client_id,
      variant_id: data.variant_id,
      workshop_id: data.workshop_id || null,
      order_number: orderNum,
      total_price: data.total_price,
      deposit_amount: data.deposit_amount || 0,
      discount_amount: data.discount_amount || 0,
      discount_reason: data.discount_reason || null,
      final_amount: finalAmount,
      estimated_delivery: data.estimated_delivery || null,
      delivery_address: data.delivery_address || null,
      delivery_method: data.delivery_method || 'pickup',
      client_notes: data.client_notes || null,
      internal_notes: data.internal_notes || null,
      priority: data.priority || 'normal',
      status: 'pending',
      current_stage: 'pattern',
      stage_started_at: new Date().toISOString(),
      assigned_artisan: data.assigned_artisan || null,
      production_notes: data.production_notes || null,
    })
    .select('*, client:cereus_clients(id, full_name), variant:cereus_variants(id, variant_name, garment:cereus_garments(id, name, code))')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order, success: true });
}

// PUT /api/cereus/orders — Update order status, stage, etc
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

  // If changing stage, update stage_started_at and log it
  if (updates.current_stage) {
    updates.stage_started_at = new Date().toISOString();

    // Get current order to know maison_id for the log
    const { data: currentOrder } = await db
      .from('cereus_orders')
      .select('maison_id, current_stage')
      .eq('id', id)
      .single();

    if (currentOrder) {
      // Log the stage change
      await db.from('cereus_production_logs').insert({
        order_id: id,
        maison_id: currentOrder.maison_id,
        stage: updates.current_stage,
        log_type: 'stage_start',
        title: `Movido a ${updates.current_stage}`,
        content: `Etapa anterior: ${currentOrder.current_stage || 'ninguna'}`,
      });
    }
  }

  const { data: order, error } = await db
    .from('cereus_orders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order, success: true });
}
