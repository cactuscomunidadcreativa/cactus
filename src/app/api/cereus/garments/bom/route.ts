import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// POST /api/cereus/garments/bom — Add material to garment BOM
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { garmentId, materialId, quantity, unit, waste_factor, notes } = body;

  if (!garmentId || !materialId || !quantity || !unit) {
    return NextResponse.json({ error: 'garmentId, materialId, quantity, and unit required' }, { status: 400 });
  }

  // Get material cost for snapshot
  const { data: material } = await db
    .from('cereus_materials')
    .select('unit_cost')
    .eq('id', materialId)
    .single();

  const unitCost = material?.unit_cost || 0;
  const wf = waste_factor || 1.10;
  const totalCost = quantity * unitCost * wf;

  const { data: bomItem, error } = await db
    .from('cereus_garment_materials')
    .insert({
      garment_id: garmentId,
      material_id: materialId,
      quantity,
      unit,
      waste_factor: wf,
      unit_cost: unitCost,
      total_cost: Math.round(totalCost * 100) / 100,
      notes: notes || null,
    })
    .select('*, material:cereus_materials(id, name, type, unit_cost, unit)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recalculate garment base_cost from all BOM items
  const { data: allBom } = await db
    .from('cereus_garment_materials')
    .select('total_cost')
    .eq('garment_id', garmentId);

  const totalMaterialCost = (allBom || []).reduce((sum: number, item: any) => sum + (item.total_cost || 0), 0);

  await db
    .from('cereus_garments')
    .update({ base_cost: Math.round(totalMaterialCost * 100) / 100, updated_at: new Date().toISOString() })
    .eq('id', garmentId);

  return NextResponse.json({ bomItem, totalMaterialCost, success: true });
}

// DELETE /api/cereus/garments/bom?id=xxx&garmentId=xxx
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const garmentId = searchParams.get('garmentId');

  if (!id || !garmentId) return NextResponse.json({ error: 'id and garmentId required' }, { status: 400 });

  const { error } = await db
    .from('cereus_garment_materials')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recalculate garment base_cost
  const { data: allBom } = await db
    .from('cereus_garment_materials')
    .select('total_cost')
    .eq('garment_id', garmentId);

  const totalMaterialCost = (allBom || []).reduce((sum: number, item: any) => sum + (item.total_cost || 0), 0);

  await db
    .from('cereus_garments')
    .update({ base_cost: Math.round(totalMaterialCost * 100) / 100, updated_at: new Date().toISOString() })
    .eq('id', garmentId);

  return NextResponse.json({ success: true, totalMaterialCost });
}
