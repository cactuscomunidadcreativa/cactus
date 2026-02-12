'use client';

import { useState, useEffect } from 'react';
import { Download, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface MonthlyData {
  mes: string;
  mesNum: number;
  presupuesto: number;
  real: number;
  acumuladoPres: number;
  acumuladoReal: number;
  varianza: number;
}

interface ReportGastoMensualProps {
  campaignId: string;
  onExport?: () => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function ReportGastoMensual({ campaignId, onExport }: ReportGastoMensualProps) {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totals, setTotals] = useState({ presupuesto: 0, real: 0, varianza: 0 });
  const [campaignYear, setCampaignYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      if (!supabase) return;

      setIsLoading(true);

      // Get campaign info for the year
      const { data: campaignData } = await supabase
        .from('tuna_campaigns')
        .select('year, season, start_date, end_date')
        .eq('id', campaignId)
        .single();

      if (campaignData) {
        setCampaignYear(campaignData.year);
      }

      // Fetch production orders with dates
      const { data: ordersData, error } = await supabase
        .from('tuna_production_orders')
        .select('fecha, costo_total')
        .eq('campaign_id', campaignId);

      if (error) {
        console.error('Error fetching monthly data:', error);
        setIsLoading(false);
        return;
      }

      // Fetch budget totals
      const { data: budgetData } = await supabase
        .from('tuna_budget')
        .select('budget_usd')
        .eq('campaign_id', campaignId);

      const totalBudget = (budgetData || []).reduce((sum, b) => sum + (parseFloat(b.budget_usd) || 0), 0);

      // Group expenses by month
      const byMonth: Record<number, number> = {};

      (ordersData || []).forEach((order) => {
        if (order.fecha) {
          const date = new Date(order.fecha);
          const month = date.getMonth() + 1; // 1-12
          if (!byMonth[month]) byMonth[month] = 0;
          byMonth[month] += parseFloat(order.costo_total) || 0;
        }
      });

      // Distribute budget evenly across months (simplified)
      // In real scenario, this would come from monthly allocation data
      const monthlyBudget = totalBudget / 12;

      // Generate monthly data
      const monthlyData: MonthlyData[] = [];
      let acumuladoPres = 0;
      let acumuladoReal = 0;

      // Determine which months to show based on campaign season
      const startMonth = campaignData?.season === 'invierno' ? 7 : 1;
      const months = campaignData?.season === 'invierno'
        ? [7, 8, 9, 10, 11, 12]
        : [1, 2, 3, 4, 5, 6];

      for (const mesNum of months) {
        const presupuesto = monthlyBudget;
        const real = byMonth[mesNum] || 0;
        acumuladoPres += presupuesto;
        acumuladoReal += real;

        monthlyData.push({
          mes: MONTH_NAMES[mesNum - 1],
          mesNum,
          presupuesto,
          real,
          acumuladoPres,
          acumuladoReal,
          varianza: real - presupuesto,
        });
      }

      const totalReal = monthlyData.reduce((sum, m) => sum + m.real, 0);
      const totalVarianza = totalReal - totalBudget;

      setData(monthlyData);
      setTotals({ presupuesto: totalBudget, real: totalReal, varianza: totalVarianza });
      setIsLoading(false);
    }

    if (campaignId) {
      fetchData();
    }
  }, [campaignId]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

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
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No hay datos mensuales para generar este reporte</p>
      </div>
    );
  }

  // Calculate max for chart scaling
  const maxValue = Math.max(...data.map(d => Math.max(d.presupuesto, d.real)));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Gasto Real vs Presupuesto</h2>
          <p className="text-sm text-muted-foreground">Análisis mensual - Campaña {campaignYear}</p>
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

      {/* Chart */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-medium mb-4">Evolución Mensual</h3>
        <div className="space-y-3">
          {data.map((month) => (
            <div key={month.mesNum} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="w-24 font-medium">{month.mes}</span>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Pres: {formatCurrency(month.presupuesto)}</span>
                  <span>Real: {formatCurrency(month.real)}</span>
                </div>
              </div>
              <div className="relative h-6 bg-muted rounded">
                {/* Budget bar */}
                <div
                  className="absolute top-0 left-0 h-3 bg-blue-400/50 rounded-t"
                  style={{ width: `${(month.presupuesto / maxValue) * 100}%` }}
                />
                {/* Actual bar */}
                <div
                  className={`absolute top-3 left-0 h-3 rounded-b ${
                    month.real <= month.presupuesto ? 'bg-tuna-green' : 'bg-red-400'
                  }`}
                  style={{ width: `${(month.real / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400/50 rounded" />
            <span>Presupuesto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-tuna-green rounded" />
            <span>Real (bajo presupuesto)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded" />
            <span>Real (sobre presupuesto)</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium text-sm">Mes</th>
              <th className="text-right p-3 font-medium text-sm">Presupuesto</th>
              <th className="text-right p-3 font-medium text-sm">Real</th>
              <th className="text-right p-3 font-medium text-sm">Varianza</th>
              <th className="text-right p-3 font-medium text-sm">Acum. Pres.</th>
              <th className="text-right p-3 font-medium text-sm">Acum. Real</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row) => (
              <tr key={row.mesNum} className="hover:bg-muted/30">
                <td className="p-3 font-medium">{row.mes}</td>
                <td className="p-3 text-right tabular-nums">{formatCurrency(row.presupuesto)}</td>
                <td className="p-3 text-right tabular-nums">{formatCurrency(row.real)}</td>
                <td className={`p-3 text-right tabular-nums ${row.varianza <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(row.varianza)}
                </td>
                <td className="p-3 text-right tabular-nums text-muted-foreground">{formatCurrency(row.acumuladoPres)}</td>
                <td className="p-3 text-right tabular-nums text-muted-foreground">{formatCurrency(row.acumuladoReal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/50 font-bold">
            <tr>
              <td className="p-3">TOTAL</td>
              <td className="p-3 text-right tabular-nums">{formatCurrency(totals.presupuesto)}</td>
              <td className="p-3 text-right tabular-nums">{formatCurrency(totals.real)}</td>
              <td className={`p-3 text-right tabular-nums ${totals.varianza <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(totals.varianza)}
              </td>
              <td className="p-3 text-right tabular-nums">{formatCurrency(totals.presupuesto)}</td>
              <td className="p-3 text-right tabular-nums">{formatCurrency(totals.real)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
