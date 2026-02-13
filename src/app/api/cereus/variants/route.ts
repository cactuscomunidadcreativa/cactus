import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/cereus/variants?garmentId=xxx or ?clientId=xxx
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const garmentId = searchParams.get('garmentId');
  const clientId = searchParams.get('clientId');
  const maisonId = searchParams.get('maisonId');
  const presetOnly = searchParams.get('preset') === 'true';

  let query = db
    .from('cereus_variants')
    .select('*, garment:cereus_garments(id, name, code, category, images, base_cost, base_price)')
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  if (garmentId) query = query.eq('garment_id', garmentId);
  if (clientId) query = query.eq('client_id', clientId);
  if (presetOnly) query = query.is('client_id', null);

  // Filter by maison through garment join if needed
  if (maisonId && !garmentId) {
    // Fetch garment IDs for maison first
    const { data: garmentIds } = await db
      .from('cereus_garments')
      .select('id')
      .eq('maison_id', maisonId);

    if (garmentIds && garmentIds.length > 0) {
      query = query.in('garment_id', garmentIds.map(g => g.id));
    } else {
      return NextResponse.json({ variants: [], total: 0 });
    }
  }

  const { data: variants, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ variants: variants || [], total: variants?.length || 0 });
}

// POST /api/cereus/variants — Create variant with auto-pricing
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const {
    garmentId, clientId, variantName, color, colorHex,
    primaryMaterialId, materialOverrides, extras,
    previewImageUrl, layerImages,
  } = body;

  if (!garmentId) {
    return NextResponse.json({ error: 'garmentId required' }, { status: 400 });
  }

  // Fetch garment for base costs
  const { data: garment } = await db
    .from('cereus_garments')
    .select('*, garment_materials:cereus_garment_materials(*, material:cereus_materials(*))')
    .eq('id', garmentId)
    .single();

  if (!garment) {
    return NextResponse.json({ error: 'Garment not found' }, { status: 404 });
  }

  // Calculate pricing
  const pricing = calculateVariantCosts(garment, materialOverrides || [], extras || {});

  const { data: variant, error } = await db
    .from('cereus_variants')
    .insert({
      garment_id: garmentId,
      client_id: clientId || null,
      variant_name: variantName || null,
      color: color || null,
      color_hex: colorHex || null,
      primary_material_id: primaryMaterialId || null,
      material_overrides: materialOverrides || [],
      extras: extras || {},
      preview_image_url: previewImageUrl || null,
      layer_images: layerImages || [],
      material_cost: pricing.materialCost,
      labor_cost: pricing.laborCost,
      extras_cost: pricing.extrasCost,
      total_cost: pricing.totalCost,
      final_price: pricing.suggestedPrice,
      margin_actual: pricing.margin,
      status: 'draft',
      ar_enabled: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ variant, pricing, success: true });
}

// PUT /api/cereus/variants — Update variant + recalc pricing
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // If materials or extras changed, recalculate pricing
  if (updates.materialOverrides !== undefined || updates.extras !== undefined) {
    const { data: existing } = await db
      .from('cereus_variants')
      .select('garment_id, material_overrides, extras')
      .eq('id', id)
      .single();

    if (existing) {
      const { data: garment } = await db
        .from('cereus_garments')
        .select('*, garment_materials:cereus_garment_materials(*, material:cereus_materials(*))')
        .eq('id', existing.garment_id)
        .single();

      if (garment) {
        const overrides = updates.materialOverrides ?? existing.material_overrides;
        const extras = updates.extras ?? existing.extras;
        const pricing = calculateVariantCosts(garment, overrides, extras);

        updates.material_cost = pricing.materialCost;
        updates.labor_cost = pricing.laborCost;
        updates.extras_cost = pricing.extrasCost;
        updates.total_cost = pricing.totalCost;
        updates.final_price = pricing.suggestedPrice;
        updates.margin_actual = pricing.margin;
      }
    }

    // Rename to DB column names
    if (updates.materialOverrides !== undefined) {
      updates.material_overrides = updates.materialOverrides;
      delete updates.materialOverrides;
    }
  }

  const { data: variant, error } = await db
    .from('cereus_variants')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ variant, success: true });
}

// DELETE /api/cereus/variants?id=xxx — Archive variant
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: 'Service not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await db
    .from('cereus_variants')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// ============================================================
// Pricing helpers
// ============================================================

const COMPLEXITY_MULTIPLIERS: Record<number, number> = {
  1: 1.0, 2: 1.25, 3: 1.50, 4: 2.0, 5: 3.0,
};

const EXTRAS_PRICES: Record<string, number> = {
  embroidery: 150,
  custom_lining: 80,
  special_buttons: 45,
  length_adjustment: 30,
  hand_finishing: 200,
  beading: 300,
  monogram: 60,
};

function calculateVariantCosts(
  garment: any,
  materialOverrides: { original_material_id: string; replacement_material_id: string }[],
  extras: Record<string, unknown>
) {
  // Base material cost from BOM
  let materialCost = 0;
  const bom = garment.garment_materials || [];

  for (const entry of bom) {
    const mat = entry.material;
    if (!mat) continue;

    // Check for override
    const override = materialOverrides.find(
      (o: any) => o.original_material_id === entry.material_id
    );

    const unitCost = override ? 0 : (entry.unit_cost || mat.unit_cost || 0);
    const wasteFactor = entry.waste_factor || 1.1;
    materialCost += entry.quantity * unitCost * wasteFactor;
  }

  // For overrides that reference new materials, we'd need to fetch them
  // For now, if there are overrides, add a 10% premium on base material cost
  if (materialOverrides.length > 0) {
    materialCost *= 1.10;
  }

  materialCost = Math.round(materialCost * 100) / 100;

  // Labor cost
  const complexityMultiplier = COMPLEXITY_MULTIPLIERS[garment.complexity_level] || 1;
  const laborCost = garment.base_labor_cost > 0
    ? Math.round(garment.base_labor_cost * complexityMultiplier * 100) / 100
    : 0;

  // Extras cost
  let extrasCost = 0;
  for (const [key, value] of Object.entries(extras)) {
    if (value === true && EXTRAS_PRICES[key]) {
      extrasCost += EXTRAS_PRICES[key];
    } else if (typeof value === 'number' && EXTRAS_PRICES[key]) {
      extrasCost += EXTRAS_PRICES[key] * value;
    }
  }
  extrasCost = Math.round(extrasCost * 100) / 100;

  // Total + overhead (12%)
  const subtotal = materialCost + laborCost + extrasCost;
  const overhead = Math.round(subtotal * 0.12 * 100) / 100;
  const totalCost = Math.round((subtotal + overhead) * 100) / 100;

  // Target margin: 50%
  const targetMargin = garment.margin_target || 0.50;
  const suggestedPrice = totalCost > 0
    ? Math.round((totalCost / (1 - targetMargin)) * 100) / 100
    : garment.base_price || 0;

  const margin = suggestedPrice > 0
    ? Math.round(((suggestedPrice - totalCost) / suggestedPrice) * 10000) / 10000
    : 0;

  return {
    materialCost,
    laborCost,
    extrasCost,
    overhead,
    totalCost,
    suggestedPrice,
    margin,
  };
}
