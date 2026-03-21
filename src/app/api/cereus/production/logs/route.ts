import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/cereus/production/logs?maisonId=xxx&orderId=xxx
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
    .from('cereus_production_logs')
    .select('*, order:cereus_orders(id, order_number, variant:cereus_variants(id, variant_name, garment:cereus_garments(id, name)))')
    .eq('maison_id', maisonId)
    .order('created_at', { ascending: false });

  if (orderId) query = query.eq('order_id', orderId);

  const { data: logs, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: logs || [] });
}

// POST /api/cereus/production/logs
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { maisonId, orderId, stage, type, title, content, hours, photos } = body;

  if (!maisonId || !orderId) {
    return NextResponse.json({ error: 'maisonId and orderId required' }, { status: 400 });
  }

  const { data: log, error } = await db
    .from('cereus_production_logs')
    .insert({
      maison_id: maisonId,
      order_id: orderId,
      stage: stage || null,
      type: type || 'update',
      title: title || null,
      content: content || null,
      hours: hours || null,
      photos: photos || [],
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ log, success: true });
}
