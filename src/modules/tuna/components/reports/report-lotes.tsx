'use client';

import { useState, useEffect } from 'react';
import { Download, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface LoteData {
  loteId: string;
  cantidad: number;
  valorVenta: number;
  costoVenta: number;
  utilidad: number;
  margenPct: number;
}

interface ReportLotesProps {
  campaignId: string;
  onExport?: () => void;
}

export function ReportLotes({ campaignId, onExport }: ReportLotesProps) {
  const [data, setData] = useState<LoteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totals, setTotals] = useState({ cantidad: 0, valorVenta: 0, costoVenta: 0, utilidad: 0 });

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      if (!supabase) return;

      setIsLoading(true);

      // Fetch export lots data
      const { data: lotsData, error } = await supabase
        .from('tuna_export_lots')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('lote_id', { ascending: true });

      if (error) {
        console.error('Error fetching lotes data:', error);
        setIsLoading(false);
        return;
      }

      if (!lotsData || lotsData.length === 0) {
        // If no export lots, try to calculate from production orders
        const { data: ordersData } = await supabase
          .from('tuna_production_orders')
          .select('*')
          .eq('campaign_id', campaignId)
          .eq('tipo', 'P') // Packing orders
          .order('numero', { ascending: true });

        if (ordersData && ordersData.length > 0) {
          const result: LoteData[] = ordersData.map((order) => {
            const costoTotal = parseFloat(order.costo_total) || 0;
            const cantidad = parseFloat(order.cantidad_producida) || 0;
            // Estimate sale value (for demo purposes)
            const valorVenta = costoTotal * 1.2; // 20% margin estimate
            const utilidad = valorVenta - costoTotal;
            const margenPct = valorVenta > 0 ? (utilidad / valorVenta) * 100 : 0;

            return {
              loteId: order.numero,
              cantidad,
              valorVenta,
              costoVenta: costoTotal,
              utilidad,
              margenPct,
            };
          });

          const totalCantidad = result.reduce((sum, r) => sum + r.cantidad, 0);
          const totalVenta = result.reduce((sum, r) => sum + r.valorVenta, 0);
          const totalCosto = result.reduce((sum, r) => sum + r.costoVenta, 0);
          const totalUtilidad = totalVenta - totalCosto;

          setData(result);
          setTotals({
            cantidad: totalCantidad,
            valorVenta: totalVenta,
            costoVenta: totalCosto,
            utilidad: totalUtilidad,
          });
        }
      } else {
        // Use actual export lots data
        const result: LoteData[] = lotsData.map((lot) => ({
          loteId: lot.lote_id,
          cantidad: parseFloat(lot.cantidad) || 0,
          valorVenta: parseFloat(lot.valor_venta) || 0,
          costoVenta: parseFloat(lot.costo_venta) || 0,
          utilidad: parseFloat(lot.utilidad) || 0,
          margenPct: parseFloat(lot.margen_percent) || 0,
        }));

        const totalCantidad = result.reduce((sum, r) => sum + r.cantidad, 0);
        const totalVenta = result.reduce((sum, r) => sum + r.valorVenta, 0);
        const totalCosto = result.reduce((sum, r) => sum + r.costoVenta, 0);
        const totalUtilidad = totalVenta - totalCosto;

        setData(result);
        setTotals({
          cantidad: totalCantidad,
          valorVenta: totalVenta,
          costoVenta: totalCosto,
          utilidad: totalUtilidad,
        });
      }

      setIsLoading(false);
    }

    if (campaignId) {
      fetchData();
    }
  }, [campaignId]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('es-PE').format(value);

  const formatPercent = (value: number) =>
    `${value.toFixed(1)}%`;

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse text-muted-foreground">Cargando reporte...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8 text-center">
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No hay datos de lotes para generar este reporte</p>
        <p className="text-sm text-muted-foreground mt-2">
          Sube el archivo de ventas o producción para ver los resultados por lote
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Resultado por Lote</h2>
          <p className="text-sm text-muted-foreground">Análisis de rentabilidad por lote de exportación</p>
        </div>
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-tuna-magenta text-white rounded-lg text-sm hover:bg-tuna-magenta-light transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-muted/50 rounded-xl">
          <p className="text-sm text-muted-foreground">Total Lotes</p>
          <p className="text-2xl font-bold">{data.length}</p>
        </div>
        <div className="p-4 bg-muted/50 rounded-xl">
          <p className="text-sm text-muted-foreground">Ventas Totales</p>
          <p className="text-2xl font-bold">{formatCurrency(totals.valorVenta)}</p>
        </div>
        <div className="p-4 bg-muted/50 rounded-xl">
          <p className="text-sm text-muted-foreground">Costo Total</p>
          <p className="text-2xl font-bold">{formatCurrency(totals.costoVenta)}</p>
        </div>
        <div className={`p-4 rounded-xl ${totals.utilidad >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          <p className="text-sm text-muted-foreground">Utilidad Total</p>
          <p className={`text-2xl font-bold ${totals.utilidad >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(totals.utilidad)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium text-sm">Lote</th>
              <th className="text-right p-3 font-medium text-sm">Cantidad</th>
              <th className="text-right p-3 font-medium text-sm">Valor Venta</th>
              <th className="text-right p-3 font-medium text-sm">Costo</th>
              <th className="text-right p-3 font-medium text-sm">Utilidad</th>
              <th className="text-right p-3 font-medium text-sm">Margen %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-muted/30">
                <td className="p-3 font-medium">{row.loteId}</td>
                <td className="p-3 text-right tabular-nums">{formatNumber(row.cantidad)}</td>
                <td className="p-3 text-right tabular-nums">{formatCurrency(row.valorVenta)}</td>
                <td className="p-3 text-right tabular-nums">{formatCurrency(row.costoVenta)}</td>
                <td className={`p-3 text-right tabular-nums ${row.utilidad >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(row.utilidad)}
                </td>
                <td className="p-3 text-right">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    row.margenPct >= 15 ? 'bg-green-500/10 text-green-500' :
                    row.margenPct >= 5 ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {formatPercent(row.margenPct)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/50 font-bold">
            <tr>
              <td className="p-3">TOTAL</td>
              <td className="p-3 text-right tabular-nums">{formatNumber(totals.cantidad)}</td>
              <td className="p-3 text-right tabular-nums">{formatCurrency(totals.valorVenta)}</td>
              <td className="p-3 text-right tabular-nums">{formatCurrency(totals.costoVenta)}</td>
              <td className={`p-3 text-right tabular-nums ${totals.utilidad >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(totals.utilidad)}
              </td>
              <td className="p-3 text-right tabular-nums">
                {formatPercent(totals.valorVenta > 0 ? (totals.utilidad / totals.valorVenta) * 100 : 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
