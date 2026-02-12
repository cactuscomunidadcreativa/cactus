import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Obtener conceptos EEFF únicos de las OPs de una campaña
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId requerido' }, { status: 400 });
    }

    // Obtener conceptos desde tuna_eeff_totals
    const { data: totals, error: totalsError } = await supabase
      .from('tuna_eeff_totals')
      .select('eeff_concept')
      .eq('campaign_id', campaignId);

    if (totalsError) {
      // Si la tabla no existe o está vacía, intentar extraer de las OPs
      const { data: orders } = await supabase
        .from('tuna_production_orders')
        .select('gastos_periodo')
        .eq('campaign_id', campaignId);

      // Extraer conceptos únicos de gastos_periodo
      const conceptsSet = new Set<string>();
      (orders || []).forEach((order) => {
        if (order.gastos_periodo && typeof order.gastos_periodo === 'object') {
          Object.keys(order.gastos_periodo).forEach((key) => {
            if (key !== 'total') {
              conceptsSet.add(key);
            }
          });
        }
      });

      // Lista predeterminada si no hay datos
      const defaultConcepts = [
        'ACCESORIOS DE RIEGO',
        'AGROQUIMICOS & FOLIAR',
        'AGUA',
        'ALMACIGO',
        'ALQUILER DE TERRENOS',
        'ALQUILER DE MAQUINARIA',
        'COMBUSTIBLE',
        'CONTRATISTAS',
        'ENERGIA ELECTRICA',
        'ENVASES',
        'FERTILIZANTE',
        'MANTENIMIENTO Y REPARACION',
        'MATERIA ORGANICA',
        'OTROS GTOS DE PERSONAL',
        'PRODUCCION DE TERCEROS',
        'SEMILLA',
        'SERVIC. DE 3ROS.',
        'SUMINISTROS',
        'TRANSPORTE DE CARGA',
      ];

      const concepts = conceptsSet.size > 0 ? Array.from(conceptsSet).sort() : defaultConcepts;

      return NextResponse.json({ concepts });
    }

    const concepts = (totals || []).map((t) => t.eeff_concept).sort();

    return NextResponse.json({ concepts: concepts.length > 0 ? concepts : [] });
  } catch (error) {
    console.error('Error fetching EEFF concepts:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
