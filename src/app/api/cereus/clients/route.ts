import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/cereus/clients?maisonId=xxx&search=xxx
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const maisonId = searchParams.get('maisonId');
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!maisonId) return NextResponse.json({ error: 'maisonId required' }, { status: 400 });

  let query = supabase
    .from('cereus_clients')
    .select('*, cereus_emotional_profiles(id, primary_archetype), cereus_body_measurements(id, is_current)', { count: 'exact' })
    .eq('maison_id', maisonId)
    .eq('activo', true);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data: clients, count, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ clients: clients || [], total: count || 0, limit, offset });
}

// POST /api/cereus/clients — Create new client
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { maisonId, ...clientData } = body;

  if (!maisonId || !clientData.full_name) {
    return NextResponse.json({ error: 'maisonId and full_name required' }, { status: 400 });
  }

  const { data: client, error } = await supabase
    .from('cereus_clients')
    .insert({
      maison_id: maisonId,
      full_name: clientData.full_name,
      email: clientData.email || null,
      phone: clientData.phone || null,
      address: clientData.address || null,
      city: clientData.city || null,
      country: clientData.country || 'MX',
      date_of_birth: clientData.date_of_birth || null,
      vip_tier: clientData.vip_tier || 'standard',
      preferred_language: clientData.preferred_language || 'es',
      preferred_contact: clientData.preferred_contact || 'whatsapp',
      internal_notes: clientData.internal_notes || null,
      style_notes: clientData.style_notes || null,
      consent_photos: clientData.consent_photos || false,
      consent_data: clientData.consent_data || false,
      consent_marketing: clientData.consent_marketing || false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ client, success: true });
}

// PUT /api/cereus/clients — Update client
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { data: client, error } = await supabase
    .from('cereus_clients')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ client, success: true });
}

// DELETE /api/cereus/clients?id=xxx — Soft delete
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase
    .from('cereus_clients')
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
