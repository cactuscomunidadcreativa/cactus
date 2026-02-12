import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: Calcular valores "Real" basados en mapeos confirmados
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Error de conexión' }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { campaignId } = await request.json();

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId requerido' }, { status: 400 });
    }

    // Verificar que la campaña pertenece al usuario
    const { data: campaign, error: campaignError } = await supabase
      .from('tuna_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
    }

    // 1. Obtener mapeos confirmados
    const { data: mappings, error: mappingsError } = await supabase
      .from('tuna_category_mappings')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('confirmed', true);

    if (mappingsError) {
      return NextResponse.json({ error: 'Error al obtener mapeos' }, { status: 500 });
    }

    if (!mappings || mappings.length === 0) {
      return NextResponse.json({ error: 'No hay mapeos confirmados' }, { status: 400 });
    }

    // 2. Obtener totales por concepto EEFF
    const { data: eeffTotals, error: totalsError } = await supabase
      .from('tuna_eeff_totals')
      .select('*')
      .eq('campaign_id', campaignId);

    // Si no hay totales precalculados, calcular desde las OPs
    let conceptTotals: Record<string, { total: number; almacigo: number; campo: number; packing: number }> = {};

    if (!totalsError && eeffTotals && eeffTotals.length > 0) {
      eeffTotals.forEach((t) => {
        conceptTotals[t.eeff_concept] = {
          total: parseFloat(t.total_amount) || 0,
          almacigo: parseFloat(t.almacigo_total) || 0,
          campo: parseFloat(t.campo_total) || 0,
          packing: parseFloat(t.packing_total) || 0,
        };
      });
    } else {
      // Calcular desde OPs
      const { data: orders } = await supabase
        .from('tuna_production_orders')
        .select('tipo, gastos_periodo, costo_total')
        .eq('campaign_id', campaignId);

      if (orders) {
        orders.forEach((order) => {
          const tipo = order.tipo; // A, C, P
          const gastos = order.gastos_periodo as Record<string, number> | null;

          if (gastos) {
            Object.entries(gastos).forEach(([concept, amount]) => {
              if (concept === 'total') return;

              if (!conceptTotals[concept]) {
                conceptTotals[concept] = { total: 0, almacigo: 0, campo: 0, packing: 0 };
              }

              const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
              conceptTotals[concept].total += numAmount;

              if (tipo === 'A') conceptTotals[concept].almacigo += numAmount;
              else if (tipo === 'C') conceptTotals[concept].campo += numAmount;
              else if (tipo === 'P') conceptTotals[concept].packing += numAmount;
            });
          }
        });
      }
    }

    // 3. Actualizar budget con valores reales
    let updatedCount = 0;

    for (const mapping of mappings) {
      const eeffTotal = conceptTotals[mapping.eeff_concept];

      if (!eeffTotal) continue;

      // Determinar el total a usar según el proceso del presupuesto
      let actualValue = 0;
      switch (mapping.budget_process) {
        case 'almacigo':
          actualValue = eeffTotal.almacigo > 0 ? eeffTotal.almacigo : eeffTotal.total;
          break;
        case 'campo_definitivo':
          actualValue = eeffTotal.campo > 0 ? eeffTotal.campo : eeffTotal.total;
          break;
        case 'packing':
          actualValue = eeffTotal.packing > 0 ? eeffTotal.packing : eeffTotal.total;
          break;
        default:
          actualValue = eeffTotal.total;
      }

      // Actualizar la categoría de presupuesto
      const { error: updateError } = await supabase
        .from('tuna_budget')
        .update({
          actual_usd: actualValue,
          updated_at: new Date().toISOString(),
        })
        .eq('campaign_id', campaignId)
        .eq('category_name', mapping.budget_category)
        .eq('process', mapping.budget_process);

      if (!updateError) {
        updatedCount++;
      }
    }

    // 4. Actualizar totales de la campaña
    const { data: budgetTotals } = await supabase
      .from('tuna_budget')
      .select('budget_usd, actual_usd')
      .eq('campaign_id', campaignId);

    if (budgetTotals) {
      const totalBudget = budgetTotals.reduce((sum, b) => sum + (parseFloat(b.budget_usd) || 0), 0);
      const totalActual = budgetTotals.reduce((sum, b) => sum + (parseFloat(b.actual_usd) || 0), 0);

      await supabase
        .from('tuna_campaigns')
        .update({
          total_budget: totalBudget,
          total_actual: totalActual,
        })
        .eq('id', campaignId);
    }

    return NextResponse.json({
      success: true,
      updatedCategories: updatedCount,
      totalMappings: mappings.length,
    });
  } catch (error) {
    console.error('Error calculating real values:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
