'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface RubroData {
  rubro: string;
  proceso: string;
  presupuesto: number;
  real: number;
  varianza: number;
  varianzaPct: number;
}

interface GroupedRubroData {
  proceso: string;
  rubros: RubroData[];
  totalPresupuesto: number;
  totalReal: number;
  totalVarianza: number;
}

interface ReportRubroProps {
  campaignId: string;
  onExport?: () => void;
}

const PROCESS_LABELS: Record<string, string> = {
  almacigo: 'ALMACIGO',
  campo_definitivo: 'CAMPO DEFINITIVO',
  packing: 'PACKING',
};

const PROCESS_COLORS: Record<string, string> = {
  almacigo: 'bg-tuna-magenta/10 border-tuna-magenta',
  campo_definitivo: 'bg-tuna-purple/10 border-tuna-purple',
  packing: 'bg-tuna-green/10 border-tuna-green',
};

export function ReportRubro({ campaignId, onExport }: ReportRubroProps) {
  const [groupedData, setGroupedData] = useState<GroupedRubroData[]>([]);
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
          .select('category_code, category_name, process, budget_usd, actual_usd')
          .eq('campaign_id', campaignId)
          .order('process')
          .order('category_name'),
        supabase
          .from('tuna_production_orders')
          .select('tipo, costo_total')
          .eq('campaign_id', campaignId),
      ]);

      if (budgetResult.error) {
        console.error('Error fetching rubro data:', budgetResult.error);
        setIsLoading(false);
        return;
      }

      const budgetData = budgetResult.data || [];
      const ordersData = ordersResult.data || [];

      // Calculate total costs by process type from production orders
      // tipo: 'A' = Almácigo, 'C' = Campo, 'P' = Packing
      const realByProcess: Record<string, number> = {
        almacigo: 0,
        campo_definitivo: 0,
        packing: 0,
      };

      ordersData.forEach((order) => {
        const cost = parseFloat(order.costo_total) || 0;
        if (order.tipo === 'A') {
          realByProcess.almacigo += cost;
        } else if (order.tipo === 'C') {
          realByProcess.campo_definitivo += cost;
        } else if (order.tipo === 'P') {
          realByProcess.packing += cost;
        }
      });

      // Group by process
      const byProcess: Record<string, RubroData[]> = {
        almacigo: [],
        campo_definitivo: [],
        packing: [],
      };

      // Calculate budget totals by process for proportional distribution
      const budgetTotalByProcess: Record<string, number> = {
        almacigo: 0,
        campo_definitivo: 0,
        packing: 0,
      };

      budgetData.forEach((row) => {
        const proceso = row.process || 'campo_definitivo';
        const presupuesto = parseFloat(row.budget_usd) || 0;
        if (budgetTotalByProcess[proceso] !== undefined) {
          budgetTotalByProcess[proceso] += presupuesto;
        }
      });

      budgetData.forEach((row) => {
        const proceso = row.process || 'campo_definitivo';
        const presupuesto = parseFloat(row.budget_usd) || 0;
        // If actual_usd exists in budget, use it; otherwise distribute real costs proportionally
        let real = parseFloat(row.actual_usd) || 0;

        if (real === 0 && realByProcess[proceso] > 0 && budgetTotalByProcess[proceso] > 0) {
          // Distribute real costs proportionally based on budget weight
          const proportion = presupuesto / budgetTotalByProcess[proceso];
          real = realByProcess[proceso] * proportion;
        }

        const varianza = real - presupuesto;
        const varianzaPct = presupuesto > 0 ? (varianza / presupuesto) * 100 : 0;

        if (!byProcess[proceso]) {
          byProcess[proceso] = [];
        }

        byProcess[proceso].push({
          rubro: row.category_name || 'Sin categoría',
          proceso,
          presupuesto,
          real,
          varianza,
          varianzaPct,
        });
      });

      // Convert to grouped structure
      const grouped: GroupedRubroData[] = Object.entries(byProcess)
        .filter(([_, rubros]) => rubros.length > 0)
        .map(([proceso, rubros]) => ({
          proceso,
          rubros,
          totalPresupuesto: rubros.reduce((sum, r) => sum + r.presupuesto, 0),
          totalReal: rubros.reduce((sum, r) => sum + r.real, 0),
          totalVarianza: rubros.reduce((sum, r) => sum + r.varianza, 0),
        }));

      // Calculate grand totals
      const grandTotalPresupuesto = grouped.reduce((sum, g) => sum + g.totalPresupuesto, 0);
      const grandTotalReal = grouped.reduce((sum, g) => sum + g.totalReal, 0);
      const grandTotalVarianza = grandTotalReal - grandTotalPresupuesto;

      setGroupedData(grouped);
      setTotals({ presupuesto: grandTotalPresupuesto, real: grandTotalReal, varianza: grandTotalVarianza });
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

  if (groupedData.length === 0) {
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
          <h2 className="text-xl font-bold">Comparativo por Rubro</h2>
          <p className="text-sm text-muted-foreground">Presupuesto vs Real agrupado por proceso y categoría</p>
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

      {/* Process Groups */}
      {groupedData.map((group) => (
        <div
          key={group.proceso}
          className={`rounded-xl border overflow-hidden ${PROCESS_COLORS[group.proceso] || 'border-border'}`}
        >
          {/* Process Header */}
          <div className="p-4 bg-muted/50 flex items-center justify-between">
            <h3 className="font-bold text-lg">{PROCESS_LABELS[group.proceso] || group.proceso.toUpperCase()}</h3>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Presupuesto:</span>
                <span className="ml-2 font-medium">{formatCurrency(group.totalPresupuesto)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Real:</span>
                <span className="ml-2 font-medium">{formatCurrency(group.totalReal)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Varianza:</span>
                <span className={`ml-2 font-medium ${group.totalVarianza <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(group.totalVarianza)}
                </span>
              </div>
            </div>
          </div>

          {/* Rubros Table */}
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left p-3 font-medium text-sm">Rubro</th>
                <th className="text-right p-3 font-medium text-sm">Presupuesto</th>
                <th className="text-right p-3 font-medium text-sm">Real</th>
                <th className="text-right p-3 font-medium text-sm">Varianza</th>
                <th className="text-right p-3 font-medium text-sm">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {group.rubros.map((row, idx) => (
                <tr key={idx} className="hover:bg-muted/20">
                  <td className="p-3">{row.rubro}</td>
                  <td className="p-3 text-right tabular-nums">{formatCurrency(row.presupuesto)}</td>
                  <td className="p-3 text-right tabular-nums">{formatCurrency(row.real)}</td>
                  <td className={`p-3 text-right tabular-nums ${row.varianza <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(row.varianza)}
                  </td>
                  <td className="p-3 text-right">
                    <VarianceBar value={row.varianzaPct} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Grand Total */}
      <div className="rounded-xl border border-border bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">TOTAL CAMPAÑA</h3>
          <div className="flex gap-6">
            <div>
              <span className="text-muted-foreground text-sm">Presupuesto:</span>
              <span className="ml-2 font-bold text-lg">{formatCurrency(totals.presupuesto)}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Real:</span>
              <span className="ml-2 font-bold text-lg">{formatCurrency(totals.real)}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Varianza:</span>
              <span className={`ml-2 font-bold text-lg ${totals.varianza <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(totals.varianza)}
              </span>
              <span className={`ml-1 text-sm ${totals.varianza <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ({formatPercent(totals.presupuesto > 0 ? (totals.varianza / totals.presupuesto) * 100 : 0)})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VarianceBar({ value }: { value: number }) {
  const absValue = Math.min(Math.abs(value), 50); // Cap at 50%
  const isNegative = value <= 0;
  const width = (absValue / 50) * 100;

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${isNegative ? 'bg-green-500' : 'bg-red-500'}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className={`text-xs tabular-nums ${isNegative ? 'text-green-500' : 'text-red-500'}`}>
        {value >= 0 ? '+' : ''}{value.toFixed(1)}%
      </span>
    </div>
  );
}
