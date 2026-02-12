'use client';

import { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ImpactoData {
  rubro: string;
  presupuesto: number;
  real: number;
  varianza: number;
  varianzaPct: number;
  impacto: 'favorable' | 'desfavorable' | 'neutral';
}

interface ReportImpactoProps {
  campaignId: string;
  onExport?: () => void;
}

export function ReportImpacto({ campaignId, onExport }: ReportImpactoProps) {
  const [data, setData] = useState<ImpactoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totals, setTotals] = useState({ presupuesto: 0, real: 0, varianza: 0 });

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      if (!supabase) return;

      setIsLoading(true);

      // Fetch budget data and production orders in parallel
      const [budgetResult, ordersResult] = await Promise.all([
        supabase
          .from('tuna_budget')
          .select('category_name, process, budget_usd, actual_usd')
          .eq('campaign_id', campaignId),
        supabase
          .from('tuna_production_orders')
          .select('tipo, costo_total')
          .eq('campaign_id', campaignId),
      ]);

      if (budgetResult.error) {
        console.error('Error fetching impacto data:', budgetResult.error);
        setIsLoading(false);
        return;
      }

      const budgetData = budgetResult.data || [];
      const ordersData = ordersResult.data || [];

      // Calculate total real costs from production orders
      const totalRealFromOrders = ordersData.reduce(
        (sum, o) => sum + (parseFloat(o.costo_total) || 0),
        0
      );

      // Calculate total budget for proportional distribution
      const totalBudget = budgetData.reduce(
        (sum, b) => sum + (parseFloat(b.budget_usd) || 0),
        0
      );

      // Group by category
      const grouped: Record<string, { presupuesto: number; real: number }> = {};

      budgetData.forEach((row) => {
        const cat = row.category_name || 'Sin categoría';
        if (!grouped[cat]) {
          grouped[cat] = { presupuesto: 0, real: 0 };
        }
        const presupuesto = parseFloat(row.budget_usd) || 0;
        let real = parseFloat(row.actual_usd) || 0;

        // If no actual_usd, distribute real costs proportionally
        if (real === 0 && totalRealFromOrders > 0 && totalBudget > 0) {
          const proportion = presupuesto / totalBudget;
          real = totalRealFromOrders * proportion;
        }

        grouped[cat].presupuesto += presupuesto;
        grouped[cat].real += real;
      });

      // Convert to array with calculations
      const result: ImpactoData[] = Object.entries(grouped)
        .map(([rubro, values]) => {
          const varianza = values.real - values.presupuesto;
          const varianzaPct = values.presupuesto > 0
            ? (varianza / values.presupuesto) * 100
            : 0;

          let impacto: 'favorable' | 'desfavorable' | 'neutral' = 'neutral';
          if (varianzaPct < -2) impacto = 'favorable'; // Spent less
          else if (varianzaPct > 2) impacto = 'desfavorable'; // Spent more

          return {
            rubro,
            presupuesto: values.presupuesto,
            real: values.real,
            varianza,
            varianzaPct,
            impacto,
          };
        })
        .sort((a, b) => Math.abs(b.varianzaPct) - Math.abs(a.varianzaPct));

      // Calculate totals
      const totalPresupuesto = result.reduce((sum, r) => sum + r.presupuesto, 0);
      const totalReal = result.reduce((sum, r) => sum + r.real, 0);
      const totalVarianza = totalReal - totalPresupuesto;

      setData(result);
      setTotals({ presupuesto: totalPresupuesto, real: totalReal, varianza: totalVarianza });
      setIsLoading(false);
    }

    if (campaignId) {
      fetchData();
    }
  }, [campaignId]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatPercent = (value: number) =>
    `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

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
        <p className="text-muted-foreground">No hay datos de presupuesto para generar este reporte</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Impacto y Rendimiento vs Presupuesto</h2>
          <p className="text-sm text-muted-foreground">Análisis de varianzas por rubro</p>
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
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-muted/50 rounded-xl">
          <p className="text-sm text-muted-foreground">Presupuesto Total</p>
          <p className="text-2xl font-bold">{formatCurrency(totals.presupuesto)}</p>
        </div>
        <div className="p-4 bg-muted/50 rounded-xl">
          <p className="text-sm text-muted-foreground">Gasto Real</p>
          <p className="text-2xl font-bold">{formatCurrency(totals.real)}</p>
        </div>
        <div className={`p-4 rounded-xl ${totals.varianza <= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          <p className="text-sm text-muted-foreground">Varianza Total</p>
          <p className={`text-2xl font-bold ${totals.varianza <= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(totals.varianza)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium text-sm">Rubro</th>
              <th className="text-right p-3 font-medium text-sm">Presupuesto</th>
              <th className="text-right p-3 font-medium text-sm">Real</th>
              <th className="text-right p-3 font-medium text-sm">Varianza</th>
              <th className="text-right p-3 font-medium text-sm">%</th>
              <th className="text-center p-3 font-medium text-sm">Impacto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-muted/30">
                <td className="p-3 font-medium">{row.rubro}</td>
                <td className="p-3 text-right tabular-nums">{formatCurrency(row.presupuesto)}</td>
                <td className="p-3 text-right tabular-nums">{formatCurrency(row.real)}</td>
                <td className={`p-3 text-right tabular-nums ${row.varianza <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(row.varianza)}
                </td>
                <td className={`p-3 text-right tabular-nums ${row.varianzaPct <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercent(row.varianzaPct)}
                </td>
                <td className="p-3 text-center">
                  <ImpactoIcon impacto={row.impacto} />
                </td>
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
              <td className={`p-3 text-right tabular-nums ${totals.varianza <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercent(totals.presupuesto > 0 ? (totals.varianza / totals.presupuesto) * 100 : 0)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function ImpactoIcon({ impacto }: { impacto: 'favorable' | 'desfavorable' | 'neutral' }) {
  switch (impacto) {
    case 'favorable':
      return <TrendingDown className="w-5 h-5 text-green-500 mx-auto" />;
    case 'desfavorable':
      return <TrendingUp className="w-5 h-5 text-red-500 mx-auto" />;
    default:
      return <Minus className="w-5 h-5 text-muted-foreground mx-auto" />;
  }
}
