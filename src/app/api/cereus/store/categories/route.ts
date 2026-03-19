import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const maisonId = searchParams.get('maisonId');
  if (!maisonId) return NextResponse.json({ error: 'maisonId required' }, { status: 400 });

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'DB error' }, { status: 500 });

  const { data, error } = await service
    .from('cereus_store_categories')
    .select('*')
    .eq('maison_id', maisonId)
    .eq('is_active', true)
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { maisonId, ...catData } = body;
  if (!maisonId) return NextResponse.json({ error: 'maisonId required' }, { status: 400 });

  if (!catData.slug && catData.name) {
    catData.slug = catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'DB error' }, { status: 500 });

  const { data, error } = await service
    .from('cereus_store_categories')
    .insert({ maison_id: maisonId, ...catData })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'DB error' }, { status: 500 });

  const { data, error } = await service
    .from('cereus_store_categories')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'DB error' }, { status: 500 });

  const { error } = await service.from('cereus_store_categories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
