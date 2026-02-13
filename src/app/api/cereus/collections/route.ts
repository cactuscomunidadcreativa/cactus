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
