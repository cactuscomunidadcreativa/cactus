import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET: List products (public for storefront, authenticated for admin)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const maisonId = searchParams.get('maisonId');
  const categoryId = searchParams.get('categoryId');
  const collectionId = searchParams.get('collectionId');
  const featured = searchParams.get('featured');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!maisonId) {
    return NextResponse.json({ error: 'maisonId required' }, { status: 400 });
  }

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  let query = service
    .from('cereus_store_products')
    .select('*, cereus_store_categories(name, slug)')
    .eq('maison_id', maisonId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .range(offset, offset + limit - 1);

  if (categoryId) query = query.eq('category_id', categoryId);
  if (collectionId) query = query.eq('collection_id', collectionId);
  if (featured === 'true') query = query.eq('is_featured', true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ products: data || [] });
}

// POST: Create product (admin only)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { maisonId, ...productData } = body;

  if (!maisonId) return NextResponse.json({ error: 'maisonId required' }, { status: 400 });

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'DB error' }, { status: 500 });

  // Auto-generate slug from name
  if (!productData.slug && productData.name) {
    productData.slug = productData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  const { data, error } = await service
    .from('cereus_store_products')
    .insert({ maison_id: maisonId, ...productData })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

// PUT: Update product
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
    .from('cereus_store_products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

// DELETE: Remove product
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

  const { error } = await service.from('cereus_store_products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
