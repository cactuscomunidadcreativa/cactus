import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

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

    const searchParams = request.nextUrl.searchParams;
    const campaignId = searchParams.get('campaignId');
    const reportType = searchParams.get('type');
    const format = searchParams.get('format') || 'json';

    if (!campaignId) {
      return NextResponse.json({ error: 'Se requiere campaignId' }, { status: 400 });
    }

    // Verify user owns the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('tuna_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
    }

    // Generate report based on type
    let reportData: Record<string, unknown>[] = [];
    let reportTitle = '';

    switch (reportType) {
      case 'impacto':
        reportTitle = 'Impacto y Rendimiento vs Presupuesto';
        reportData = await generateImpactoReport(supabase, campaignId);
        break;

      case 'lotes':
        reportTitle = 'Resultado por Lote';
        reportData = await generateLotesReport(supabase, campaignId);
        break;

      case 'rubro':
        reportTitle = 'Comparativo por Rubro';
        reportData = await generateRubroReport(supabase, campaignId);
        break;

      case 'mensual':
        reportTitle = 'Gasto Real vs Presupuesto Mensual';
        reportData = await generateMensualReport(supabase, campaignId);
        break;

      case 'ratios':
        reportTitle = 'Ratios de Campaña';
        reportData = await generateRatiosReport(supabase, campaignId);
        break;

      default:
        return NextResponse.json({ error: 'Tipo de reporte no válido' }, { status: 400 });
    }

    // Return JSON or Excel
    if (format === 'excel') {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(reportData);

      // Add title row
      XLSX.utils.sheet_add_aoa(worksheet, [[reportTitle]], { origin: 'A1' });

      // Add column widths
      const colWidths = Object.keys(reportData[0] || {}).map(() => ({ wch: 15 }));
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, reportType || 'Reporte');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${reportType}_${campaign.name}.xlsx"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      campaign: campaign.name,
      reportType,
      data: reportData,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateImpactoReport(supabase: any, campaignId: string) {
  const { data: budgetData } = await supabase
    .from('tuna_budget')
    .select('category_name, budget_usd, actual_usd')
    .eq('campaign_id', campaignId);

  const grouped: Record<string, { presupuesto: number; real: number }> = {};

  (budgetData || []).forEach((row: { category_name: string; budget_usd: string; actual_usd: string }) => {
    const cat = row.category_name || 'Sin categoría';
    if (!grouped[cat]) {
      grouped[cat] = { presupuesto: 0, real: 0 };
    }
    grouped[cat].presupuesto += parseFloat(row.budget_usd) || 0;
    grouped[cat].real += parseFloat(row.actual_usd) || 0;
  });

  return Object.entries(grouped).map(([rubro, values]) => {
    const varianza = values.real - values.presupuesto;
    const varianzaPct = values.presupuesto > 0 ? (varianza / values.presupuesto) * 100 : 0;

    return {
      Rubro: rubro,
      'Presupuesto (USD)': values.presupuesto.toFixed(2),
      'Real (USD)': values.real.toFixed(2),
      'Varianza (USD)': varianza.toFixed(2),
      'Varianza %': `${varianzaPct.toFixed(1)}%`,
      Impacto: varianzaPct < -2 ? 'Favorable' : varianzaPct > 2 ? 'Desfavorable' : 'Neutral',
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateLotesReport(supabase: any, campaignId: string) {
  const { data: ordersData } = await supabase
    .from('tuna_production_orders')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('tipo', 'P')
    .order('numero');

  return (ordersData || []).map((order: {
    numero: string;
    cantidad_producida: string;
    costo_total: string;
  }) => {
    const costoTotal = parseFloat(order.costo_total) || 0;
    const cantidad = parseFloat(order.cantidad_producida) || 0;
    const valorVenta = costoTotal * 1.2;
    const utilidad = valorVenta - costoTotal;
    const margenPct = valorVenta > 0 ? (utilidad / valorVenta) * 100 : 0;

    return {
      Lote: order.numero,
      Cantidad: cantidad.toFixed(0),
      'Valor Venta (USD)': valorVenta.toFixed(2),
      'Costo (USD)': costoTotal.toFixed(2),
      'Utilidad (USD)': utilidad.toFixed(2),
      'Margen %': `${margenPct.toFixed(1)}%`,
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateRubroReport(supabase: any, campaignId: string) {
  const { data: budgetData } = await supabase
    .from('tuna_budget')
    .select('category_name, process, budget_usd, actual_usd')
    .eq('campaign_id', campaignId)
    .order('process')
    .order('category_name');

  const PROCESS_LABELS: Record<string, string> = {
    almacigo: 'ALMACIGO',
    campo_definitivo: 'CAMPO DEFINITIVO',
    packing: 'PACKING',
  };

  return (budgetData || []).map((row: {
    category_name: string;
    process: string;
    budget_usd: string;
    actual_usd: string;
  }) => {
    const presupuesto = parseFloat(row.budget_usd) || 0;
    const real = parseFloat(row.actual_usd) || 0;
    const varianza = real - presupuesto;
    const varianzaPct = presupuesto > 0 ? (varianza / presupuesto) * 100 : 0;

    return {
      Proceso: PROCESS_LABELS[row.process] || row.process,
      Rubro: row.category_name || 'Sin categoría',
      'Presupuesto (USD)': presupuesto.toFixed(2),
      'Real (USD)': real.toFixed(2),
      'Varianza (USD)': varianza.toFixed(2),
      'Varianza %': `${varianzaPct.toFixed(1)}%`,
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateMensualReport(supabase: any, campaignId: string) {
  const { data: campaign } = await supabase
    .from('tuna_campaigns')
    .select('season')
    .eq('id', campaignId)
    .single();

  const { data: ordersData } = await supabase
    .from('tuna_production_orders')
    .select('fecha, costo_total')
    .eq('campaign_id', campaignId);

  const { data: budgetData } = await supabase
    .from('tuna_budget')
    .select('budget_usd')
    .eq('campaign_id', campaignId);

  const totalBudget = (budgetData || []).reduce(
    (sum: number, b: { budget_usd: string }) => sum + (parseFloat(b.budget_usd) || 0),
    0
  );

  const byMonth: Record<number, number> = {};
  (ordersData || []).forEach((order: { fecha: string; costo_total: string }) => {
    if (order.fecha) {
      const date = new Date(order.fecha);
      const month = date.getMonth() + 1;
      if (!byMonth[month]) byMonth[month] = 0;
      byMonth[month] += parseFloat(order.costo_total) || 0;
    }
  });

  const monthlyBudget = totalBudget / 6;
  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const months = campaign?.season === 'invierno' ? [7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6];

  let acumuladoPres = 0;
  let acumuladoReal = 0;

  return months.map((mesNum) => {
    const presupuesto = monthlyBudget;
    const real = byMonth[mesNum] || 0;
    acumuladoPres += presupuesto;
    acumuladoReal += real;
    const varianza = real - presupuesto;

    return {
      Mes: MONTH_NAMES[mesNum - 1],
      'Presupuesto (USD)': presupuesto.toFixed(2),
      'Real (USD)': real.toFixed(2),
      'Varianza (USD)': varianza.toFixed(2),
      'Acum. Presupuesto': acumuladoPres.toFixed(2),
      'Acum. Real': acumuladoReal.toFixed(2),
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateRatiosReport(supabase: any, campaignId: string) {
  const { data: ordersData } = await supabase
    .from('tuna_production_orders')
    .select('*')
    .eq('campaign_id', campaignId);

  const { data: budgetData } = await supabase
    .from('tuna_budget')
    .select('budget_usd, actual_usd')
    .eq('campaign_id', campaignId);

  const orders = ordersData || [];
  const budget = budgetData || [];

  const opsTotal = orders.length;
  const opsCerradas = orders.filter((o: { estado: string }) => o.estado === 'cerrado').length;
  const produccionTotal = orders.reduce(
    (sum: number, o: { cantidad_producida: string }) => sum + (parseFloat(o.cantidad_producida) || 0),
    0
  );
  const costoTotal = orders.reduce(
    (sum: number, o: { costo_total: string }) => sum + (parseFloat(o.costo_total) || 0),
    0
  );

  const presupuestoTotal = budget.reduce(
    (sum: number, b: { budget_usd: string }) => sum + (parseFloat(b.budget_usd) || 0),
    0
  );
  const gastoReal = budget.reduce(
    (sum: number, b: { actual_usd: string }) => sum + (parseFloat(b.actual_usd) || 0),
    0
  ) || costoTotal;

  const hectareas = 100;

  return [
    { Ratio: 'Costo por Kg', Valor: `$${(produccionTotal > 0 ? costoTotal / produccionTotal : 0).toFixed(4)}`, Unidad: 'USD/kg' },
    { Ratio: 'Costo por Ha', Valor: `$${(costoTotal / hectareas).toFixed(2)}`, Unidad: 'USD/ha' },
    { Ratio: 'Costo por OP', Valor: `$${(opsTotal > 0 ? costoTotal / opsTotal : 0).toFixed(2)}`, Unidad: 'USD/OP' },
    { Ratio: 'Rendimiento/Ha', Valor: (produccionTotal / hectareas).toFixed(2), Unidad: 'kg/ha' },
    { Ratio: 'Producción Total', Valor: produccionTotal.toFixed(0), Unidad: 'kg' },
    { Ratio: 'OPs Cerradas', Valor: `${opsCerradas}/${opsTotal}`, Unidad: '' },
    { Ratio: 'Presupuesto Total', Valor: `$${presupuestoTotal.toFixed(2)}`, Unidad: 'USD' },
    { Ratio: 'Gasto Real', Valor: `$${gastoReal.toFixed(2)}`, Unidad: 'USD' },
    { Ratio: 'Varianza', Valor: `${(presupuestoTotal > 0 ? ((gastoReal - presupuestoTotal) / presupuestoTotal) * 100 : 0).toFixed(1)}%`, Unidad: '' },
    { Ratio: 'Ejecución', Valor: `${(presupuestoTotal > 0 ? (gastoReal / presupuestoTotal) * 100 : 0).toFixed(1)}%`, Unidad: '' },
    { Ratio: 'Eficiencia OPs', Valor: `${(opsTotal > 0 ? (opsCerradas / opsTotal) * 100 : 0).toFixed(0)}%`, Unidad: '' },
  ];
}
