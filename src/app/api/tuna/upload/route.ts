import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  parsePresupuesto,
  parseGastosOP,
  parseProduccion,
  detectFileType,
  type ParseResult,
} from '@/modules/tuna/lib/excel-parser';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Error de conexión' }, { status: 500 });
    }

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el archivo
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dataType = formData.get('dataType') as string;
    let campaignId = formData.get('campaignId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Leer el archivo
    const buffer = await file.arrayBuffer();

    // Detectar tipo si no se especificó
    const fileType = dataType || detectFileType(file.name, buffer);

    if (fileType === 'unknown') {
      return NextResponse.json(
        { error: 'No se pudo determinar el tipo de archivo. Por favor selecciona el tipo manualmente.' },
        { status: 400 }
      );
    }

    // Si no hay campaña, crear una o usar la activa
    if (!campaignId) {
      // Buscar campaña activa del usuario
      const { data: existingCampaign } = await supabase
        .from('tuna_campaigns')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingCampaign) {
        campaignId = existingCampaign.id;
      } else {
        // Crear nueva campaña
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const season = month >= 6 ? 'invierno' : 'verano';
        const startMonth = season === 'invierno' ? 6 : 0;
        const endMonth = season === 'invierno' ? 11 : 5;
        const startDate = new Date(year, startMonth, 1);
        const endDate = new Date(year, endMonth + 1, 0);

        const { data: newCampaign, error: createError } = await supabase
          .from('tuna_campaigns')
          .insert({
            user_id: user.id,
            name: `${season === 'invierno' ? 'Invierno' : 'Verano'} ${year}`,
            season,
            year,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            status: 'active',
            exchange_rate: 3.8,
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating campaign:', createError);
          return NextResponse.json({ error: 'Error al crear campaña' }, { status: 500 });
        }

        campaignId = newCampaign.id;
      }
    }

    // Procesar según el tipo
    type ResultType = ParseResult<unknown>;
    let result: ResultType | null = null;
    let processedData: Record<string, unknown>[] = [];
    let tableName = '';

    switch (fileType) {
      case 'presupuesto': {
        const presResult = parsePresupuesto(buffer);
        result = presResult as ResultType;
        tableName = 'tuna_budget';
        if (presResult.success && presResult.data) {
          processedData = presResult.data.categories.map((cat) => ({
            campaign_id: campaignId,
            user_id: user.id,
            category_code: cat.code,
            category_name: cat.name,
            process: cat.process,
            budget_usd: cat.budgetUSD,
            actual_usd: cat.actualUSD,
            exchange_rate: presResult.data!.exchangeRate,
          }));
        }
        break;
      }

      case 'gastos_op': {
        const opResult = parseGastosOP(buffer);
        result = opResult as ResultType;
        tableName = 'tuna_production_orders';
        if (opResult.success && opResult.data) {
          processedData = opResult.data.map((order) => ({
            campaign_id: campaignId,
            user_id: user.id,
            numero: order.numero,
            tipo: order.tipo,
            fecha: order.fecha.toISOString().split('T')[0],
            fecha_cierre: order.fechaCierre?.toISOString().split('T')[0] || null,
            estado: order.estado,
            codigo_producto: order.codigoProducto,
            descripcion: order.descripcion,
            cantidad_estimada: order.cantidadEstimada,
            cantidad_producida: order.cantidadProducida,
            diferencia_cantidad: order.diferenciaCantidad,
            gastos_periodo: order.gastosPeriodo,
            gastos_acumulados: order.gastosAcumulados,
            costo_unitario: order.costoUnitario,
            costo_total: order.costoTotal,
            horas_mano_obra: order.horasManoObra,
          }));

          // Guardar totales por concepto EEFF para el mapeo con IA
          const eeffTotals = (opResult as unknown as { eeffTotals?: Record<string, { total: number; almacigo: number; campo: number; packing: number }> }).eeffTotals;
          if (eeffTotals && Object.keys(eeffTotals).length > 0) {
            // Eliminar totales existentes
            await supabase
              .from('tuna_eeff_totals')
              .delete()
              .eq('campaign_id', campaignId);

            // Insertar nuevos totales
            const eeffData = Object.entries(eeffTotals).map(([concept, totals]) => ({
              campaign_id: campaignId,
              eeff_concept: concept,
              total_amount: totals.total,
              almacigo_total: totals.almacigo,
              campo_total: totals.campo,
              packing_total: totals.packing,
            }));

            const { error: eeffError } = await supabase
              .from('tuna_eeff_totals')
              .insert(eeffData);

            if (eeffError) {
              console.error('Error guardando EEFF totals:', eeffError);
            }
          }
        }
        break;
      }

      case 'produccion': {
        const prodResult = parseProduccion(buffer);
        result = prodResult as ResultType;
        tableName = 'tuna_varianzas';
        if (prodResult.success && prodResult.data) {
          processedData = prodResult.data.varianzas.map((v) => ({
            campaign_id: campaignId,
            user_id: user.id,
            rubro: v.rubro,
            budget_usd: v.budget,
            actual_usd: v.actual,
            variance_usd: v.variance,
            variance_percent: v.budget > 0 ? ((v.actual - v.budget) / v.budget) * 100 : 0,
          }));
        }
        break;
      }

      case 'ventas':
        // TODO: Implementar parser de ventas
        return NextResponse.json(
          { error: 'El parser de ventas aún no está implementado' },
          { status: 501 }
        );

      default:
        return NextResponse.json({ error: 'Tipo de archivo no soportado' }, { status: 400 });
    }

    if (!result || !result.success) {
      return NextResponse.json(
        {
          error: 'Error al procesar el archivo',
          details: result?.errors || [],
        },
        { status: 400 }
      );
    }

    // Insertar datos en la tabla correspondiente
    if (processedData.length > 0 && tableName) {
      // Primero eliminar datos existentes de esta campaña para evitar duplicados
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting existing data:', deleteError);
      }

      // Insertar nuevos datos en lotes de 100
      const batchSize = 100;
      for (let i = 0; i < processedData.length; i += batchSize) {
        const batch = processedData.slice(i, i + batchSize);
        const { error: insertError } = await supabase.from(tableName).insert(batch);

        if (insertError) {
          console.error('Error inserting data:', insertError);
          return NextResponse.json(
            { error: 'Error al guardar datos en la base de datos', details: insertError.message },
            { status: 500 }
          );
        }
      }

      // Actualizar totales de la campaña si es presupuesto
      if (fileType === 'presupuesto') {
        const totalBudget = processedData.reduce((sum, row) => sum + (Number(row.budget_usd) || 0), 0);
        await supabase
          .from('tuna_campaigns')
          .update({ total_budget: totalBudget })
          .eq('id', campaignId);
      }
    }

    // Registrar el upload
    const { data: uploadRecord, error: uploadError } = await supabase
      .from('tuna_uploads')
      .insert({
        user_id: user.id,
        campaign_id: campaignId,
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        records_processed: result.summary.processedRows,
        records_skipped: result.summary.skippedRows,
        errors: result.errors,
        warnings: result.warnings,
        status: 'completed',
      })
      .select()
      .single();

    if (uploadError) {
      console.error('Error registrando upload:', uploadError);
    }

    return NextResponse.json({
      success: true,
      fileType,
      campaignId,
      summary: result.summary,
      errors: result.errors,
      warnings: result.warnings,
      uploadId: uploadRecord?.id,
      recordsInserted: processedData.length,
      preview: processedData.slice(0, 5),
    });
  } catch (error) {
    console.error('Error en upload:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    );
  }
}
