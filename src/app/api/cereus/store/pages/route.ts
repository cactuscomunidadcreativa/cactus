import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const maisonId = searchParams.get('maisonId');
  const slug = searchParams.get('slug');
  if (!maisonId) return NextResponse.json({ error: 'maisonId required' }, { status: 400 });

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'DB error' }, { status: 500 });

  if (slug) {
    const { data, error } = await service
      .from('cereus_store_pages')
      .select('*')
      .eq('maison_id', maisonId)
      .eq('slug', slug)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ page: data });
  }

  const { data, error } = await service
    .from('cereus_store_pages')
    .select('*')
    .eq('maison_id', maisonId)
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pages: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { maisonId, ...pageData } = body;

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'DB error' }, { status: 500 });

  const { data, error } = await service
    .from('cereus_store_pages')
    .insert({ maison_id: maisonId, ...pageData })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ page: data });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'DB error' }, { status: 500 });

  const { data, error } = await service
    .from('cereus_store_pages')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ page: data });
}
