import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/cereus/workshops?maisonId=xxx
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

  const { data: workshops, error } = await db
    .from('cereus_workshops')
    .select('*')
    .eq('maison_id', maisonId)
    .eq('activo', true)
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workshops: workshops || [] });
}

// POST /api/cereus/workshops
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { maisonId, ...data } = body;

  if (!maisonId || !data.name) {
    return NextResponse.json({ error: 'maisonId and name required' }, { status: 400 });
  }

  const { data: workshop, error } = await db
    .from('cereus_workshops')
    .insert({
      maison_id: maisonId,
      name: data.name,
      code: data.code || null,
      location: data.location || null,
      city: data.city || null,
      country: data.country || 'MX',
      contact_name: data.contact_name || null,
      contact_phone: data.contact_phone || null,
      contact_email: data.contact_email || null,
      specialties: data.specialties || [],
      capacity_monthly: data.capacity_monthly || null,
      avg_lead_time_days: data.avg_lead_time_days || null,
      labor_rate_hourly: data.labor_rate_hourly || null,
      currency: data.currency || 'MXN',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workshop, success: true });
}
