import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/cereus/production/notes?maisonId=xxx&orderId=xxx&workshopId=xxx&type=xxx&unresolvedOnly=true
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
  const workshopId = searchParams.get('workshopId');
  const type = searchParams.get('type');
  const unresolvedOnly = searchParams.get('unresolvedOnly') === 'true';

  if (!maisonId) return NextResponse.json({ error: 'maisonId required' }, { status: 400 });

  let query = db
    .from('cereus_workshop_notes')
    .select('*, order:cereus_orders(id, order_number, variant:cereus_variants(id, variant_name, garment:cereus_garments(id, name))), workshop:cereus_workshops(id, name)')
    .eq('maison_id', maisonId)
    .order('created_at', { ascending: false });

  if (orderId) query = query.eq('order_id', orderId);
  if (workshopId) query = query.eq('workshop_id', workshopId);
  if (type) query = query.eq('type', type);
  if (unresolvedOnly) query = query.eq('resolved', false);

  const { data: notes, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: notes || [] });
}

// POST /api/cereus/production/notes
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { maisonId, orderId, workshopId, type, content, is_critical, photos } = body;

  if (!maisonId || !orderId || !type || !content) {
    return NextResponse.json({ error: 'maisonId, orderId, type, and content required' }, { status: 400 });
  }

  const { data: note, error } = await db
    .from('cereus_workshop_notes')
    .insert({
      maison_id: maisonId,
      order_id: orderId,
      workshop_id: workshopId || null,
      type,
      content,
      is_critical: is_critical || false,
      photos: photos || [],
      resolved: false,
      created_by: user.id,
    })
    .select('*, order:cereus_orders(id, order_number, variant:cereus_variants(id, variant_name, garment:cereus_garments(id, name))), workshop:cereus_workshops(id, name)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note, success: true });
}

// PUT /api/cereus/production/notes
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { id, resolved, resolution_text, content, is_critical } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (resolved !== undefined) {
    updates.resolved = resolved;
    updates.resolved_at = resolved ? new Date().toISOString() : null;
    updates.resolved_by = resolved ? user.id : null;
  }
  if (resolution_text !== undefined) updates.resolution_text = resolution_text;
  if (content !== undefined) updates.content = content;
  if (is_critical !== undefined) updates.is_critical = is_critical;

  const { data: note, error } = await db
    .from('cereus_workshop_notes')
    .update(updates)
    .eq('id', id)
    .select('*, order:cereus_orders(id, order_number, variant:cereus_variants(id, variant_name, garment:cereus_garments(id, name))), workshop:cereus_workshops(id, name)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note, success: true });
}
