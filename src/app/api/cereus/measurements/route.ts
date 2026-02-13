import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/cereus/measurements?clientId=xxx
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });

  const { data: measurements, error } = await db
    .from('cereus_body_measurements')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ measurements: measurements || [] });
}

// POST /api/cereus/measurements — Create new measurement set
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { clientId, ...measurementData } = body;

  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });

  // Mark previous measurements as not current
  await db
    .from('cereus_body_measurements')
    .update({ is_current: false })
    .eq('client_id', clientId)
    .eq('is_current', true);

  const { data: measurement, error } = await db
    .from('cereus_body_measurements')
    .insert({
      client_id: clientId,
      measured_by: user.id,
      is_current: true,
      bust: measurementData.bust || null,
      underbust: measurementData.underbust || null,
      waist: measurementData.waist || null,
      high_hip: measurementData.high_hip || null,
      hip: measurementData.hip || null,
      shoulder_width: measurementData.shoulder_width || null,
      arm_length: measurementData.arm_length || null,
      wrist: measurementData.wrist || null,
      neck: measurementData.neck || null,
      torso_length: measurementData.torso_length || null,
      inseam: measurementData.inseam || null,
      outseam: measurementData.outseam || null,
      thigh: measurementData.thigh || null,
      knee: measurementData.knee || null,
      calf: measurementData.calf || null,
      ankle: measurementData.ankle || null,
      height: measurementData.height || null,
      weight: measurementData.weight || null,
      shoe_size: measurementData.shoe_size || null,
      bra_size: measurementData.bra_size || null,
      body_shape: measurementData.body_shape || null,
      posture_notes: measurementData.posture_notes || null,
      notes: measurementData.notes || null,
      fit_preferences: measurementData.fit_preferences || {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ measurement, success: true });
}
