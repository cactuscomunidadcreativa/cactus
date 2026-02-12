import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  calcularPrecioCompleto,
  simularDescuento,
  clasificarPrecio,
  calcularMargen,
  DEFAULT_MARGIN_RANGES,
  type MarginRange,
} from '@/modules/agave/lib/pricing-engine';

// POST - Calculate prices (NO AI - pure math)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tipo,           // 'precio' | 'simulacion' | 'clasificacion'
      costo,          // Cost base
      precio,         // Current price (for classification/simulation)
      margenObjetivo, // Target margin (optional)
      descuento,      // Discount percentage (for simulation)
      ventasMensuales, // Monthly sales (for simulation)
      clientId,       // Client ID (to get custom ranges)
      productoId,     // Product ID (optional)
    } = body;

    // Get custom margin ranges if client specified
    let rangos: MarginRange[] = DEFAULT_MARGIN_RANGES;
    let targetMargin = margenObjetivo || 0.27;

    if (clientId) {
      const { data: client } = await supabase
        .from('agave_clients')
        .select('rangos_margen, margen_objetivo')
        .eq('id', clientId)
        .single();

      if (client) {
        if (client.rangos_margen) {
          rangos = client.rangos_margen as MarginRange[];
        }
        if (!margenObjetivo && client.margen_objetivo) {
          targetMargin = parseFloat(client.margen_objetivo);
        }
      }
    }

    let result: any;

    switch (tipo) {
      case 'precio':
        // Calculate all prices for a cost
        if (typeof costo !== 'number' || costo <= 0) {
          return NextResponse.json({ error: 'Valid cost is required' }, { status: 400 });
        }
        result = {
          tipo: 'precio',
          datos: calcularPrecioCompleto(costo, targetMargin, rangos),
        };
        break;

      case 'simulacion':
        // Simulate a discount scenario
        if (typeof precio !== 'number' || precio <= 0) {
          return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
        }
        if (typeof costo !== 'number' || costo <= 0) {
          return NextResponse.json({ error: 'Valid cost is required' }, { status: 400 });
        }
        if (typeof descuento !== 'number') {
          return NextResponse.json({ error: 'Discount percentage is required' }, { status: 400 });
        }

        result = {
          tipo: 'simulacion',
          datos: simularDescuento(
            precio,
            costo,
            descuento,
            ventasMensuales || 0,
            rangos
          ),
        };
        break;

      case 'clasificacion':
        // Classify a price
        if (typeof precio !== 'number' || precio <= 0) {
          return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
        }
        if (typeof costo !== 'number' || costo <= 0) {
          return NextResponse.json({ error: 'Valid cost is required' }, { status: 400 });
        }

        const classification = clasificarPrecio(precio, costo, rangos);
        const margin = calcularMargen(precio, costo);

        result = {
          tipo: 'clasificacion',
          datos: {
            precio,
            costo,
            margen: Math.round(margin * 10000) / 100, // As percentage
            categoria: classification.categoria,
            color: classification.color,
            siguiente: classification.siguiente,
          },
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid calculation type. Use: precio, simulacion, or clasificacion' },
          { status: 400 }
        );
    }

    // Log the query if product specified
    if (productoId && clientId) {
      await supabase.from('agave_queries').insert({
        client_id: clientId,
        user_id: user.id,
        producto_id: productoId,
        costo_consultado: costo,
        precio_recomendado: result.datos?.precioRecomendado || result.datos?.precio,
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AGAVE calculate error:', error);
    return NextResponse.json(
      { error: error.message || 'Calculation error' },
      { status: 500 }
    );
  }
}
