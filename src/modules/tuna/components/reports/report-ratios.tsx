'use client';

import { useState, useEffect } from 'react';
import { Download, TrendingUp, DollarSign, Package, Activity, Target } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface RatiosData {
  // Eficiencia
  costoKg: number;
  costoHa: number;
  costoOP: number;

  // Productividad
  rendimientoHa: number;
  produccionTotal: number;
  opsTotal: number;
  opsCerradas: number;

  // Financieros
  presupuestoTotal: number;
  gastoReal: number;
  varianzaPct: number;
  margenBruto: number;

  // Performance
  ejecucionPct: number;
  desviacionPct: number;
  eficienciaOps: number;
}

interface ReportRatiosProps {
  campaignId: string;
  onExport?: () => void;
}

export function ReportRatios({ campaignId, onExport }: ReportRatiosProps) {
  const [data, setData] = useState<RatiosData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [campaignName, setCampaignName] = useState('');

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      if (!supabase) return;

      setIsLoading(true);

      // Fetch campaign info
      const { data: campaign } = await supabase
        .from('tuna_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaign) {
        setCampaignName(campaign.name);
      }

      // Fetch production orders
      const { data: ordersData } = await supabase
        .from('tuna_production_orders')
        .select('*')
        .eq('campaign_id', campaignId);

      // Fetch budget data
      const { data: budgetData } = await supabase
        .from('tuna_budget')
        .select('*')
        .eq('campaign_id', campaignId);

      // Calculate ratios
      const orders = ordersData || [];
      const budget = budgetData || [];

      const opsTotal = orders.length;
      const opsCerradas = orders.filter(o => o.estado === 'cerrado').length;
      const produccionTotal = orders.reduce((sum, o) => sum + (parseFloat(o.cantidad_producida) || 0), 0);
      const costoTotal = orders.reduce((sum, o) => sum + (parseFloat(o.costo_total) || 0), 0);

      const presupuestoTotal = budget.reduce((sum, b) => sum + (parseFloat(b.budget_usd) || 0), 0);
      const gastoReal = budget.reduce((sum, b) => sum + (parseFloat(b.actual_usd) || 0), 0) || costoTotal;

      // TODO: Get hectares from campaign config
      const hectareas = 100; // Default

      const ratios: RatiosData = {
        // Eficiencia
        costoKg: produccionTotal > 0 ? costoTotal / produccionTotal : 0,
        costoHa: costoTotal / hectareas,
        costoOP: opsTotal > 0 ? costoTotal / opsTotal : 0,

        // Productividad
        rendimientoHa: produccionTotal / hectareas,
        produccionTotal,
        opsTotal,
        opsCerradas,

        // Financieros
        presupuestoTotal,
        gastoReal,
        varianzaPct: presupuestoTotal > 0 ? ((gastoReal - presupuestoTotal) / presupuestoTotal) * 100 : 0,
        margenBruto: 0, // TODO: Calculate from sales

        // Performance
        ejecucionPct: presupuestoTotal > 0 ? (gastoReal / presupuestoTotal) * 100 : 0,
        desviacionPct: presupuestoTotal > 0 ? Math.abs((gastoReal - presupuestoTotal) / presupuestoTotal) * 100 : 0,
        eficienciaOps: opsTotal > 0 ? (opsCerradas / opsTotal) * 100 : 0,
      };

      setData(ratios);
      setIsLoading(false);
    }

    if (campaignId) {
      fetchData();
    }
  }, [campaignId]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatNumber = (value: number, decimals = 2) =>
    new Intl.NumberFormat('es-PE', { maximumFractionDigits: decimals }).format(value);

  const formatPercent = (value: number) =>
    `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse text-muted-foreground">Cargando reporte...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No hay datos suficientes para calcular los ratios</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Ratios de Campaña</h2>
          <p className="text-sm text-muted-foreground">{campaignName || 'Indicadores clave de desempeño'}</p>
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Ejecución Presupuestal */}
        <RatioCard
          title="Ejecución Presupuestal"
          value={`${data.ejecucionPct.toFixed(1)}%`}
          subtitle={`${formatCurrency(data.gastoReal)} de ${formatCurrency(data.presupuestoTotal)}`}
          icon={<Target className="w-5 h-5" />}
          color={data.ejecucionPct <= 100 ? 'green' : 'red'}
        />

        {/* Varianza */}
        <RatioCard
          title="Varianza"
          value={formatPercent(data.varianzaPct)}
          subtitle={formatCurrency(data.gastoReal - data.presupuestoTotal)}
          icon={<TrendingUp className="w-5 h-5" />}
          color={data.varianzaPct <= 0 ? 'green' : 'red'}
        />

        {/* Costo por Kg */}
        <RatioCard
          title="Costo por Kg"
          value={`$${data.costoKg.toFixed(3)}`}
          subtitle={`${formatNumber(data.produccionTotal)} kg total`}
          icon={<DollarSign className="w-5 h-5" />}
          color="neutral"
        />

        {/* Eficiencia OPs */}
        <RatioCard
          title="Eficiencia OPs"
          value={`${data.eficienciaOps.toFixed(0)}%`}
          subtitle={`${data.opsCerradas} de ${data.opsTotal} cerradas`}
          icon={<Package className="w-5 h-5" />}
          color={data.eficienciaOps >= 80 ? 'green' : data.eficienciaOps >= 50 ? 'yellow' : 'red'}
        />
      </div>

      {/* Detailed Ratios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Eficiencia */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-tuna-magenta" />
            Ratios de Eficiencia
          </h3>
          <div className="space-y-3">
            <RatioRow label="Costo por Kg" value={`$${data.costoKg.toFixed(4)}`} />
            <RatioRow label="Costo por Ha" value={formatCurrency(data.costoHa)} />
            <RatioRow label="Costo por OP" value={formatCurrency(data.costoOP)} />
          </div>
        </div>

        {/* Productividad */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-tuna-green" />
            Ratios de Productividad
          </h3>
          <div className="space-y-3">
            <RatioRow label="Rendimiento/Ha" value={`${formatNumber(data.rendimientoHa)} kg`} />
            <RatioRow label="Producción Total" value={`${formatNumber(data.produccionTotal)} kg`} />
            <RatioRow label="OPs Cerradas" value={`${data.opsCerradas} / ${data.opsTotal}`} />
          </div>
        </div>

        {/* Performance */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-tuna-purple" />
            Ratios de Performance
          </h3>
          <div className="space-y-3">
            <RatioRow label="Ejecución" value={`${data.ejecucionPct.toFixed(1)}%`} highlight={data.ejecucionPct > 100} />
            <RatioRow label="Desviación" value={`${data.desviacionPct.toFixed(1)}%`} highlight={data.desviacionPct > 10} />
            <RatioRow label="Eficiencia OPs" value={`${data.eficienciaOps.toFixed(0)}%`} />
          </div>
        </div>
      </div>

      {/* Performance Gauges */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold mb-4">Indicadores de Cumplimiento</h3>
        <div className="grid grid-cols-3 gap-8">
          <ProgressGauge
            label="Ejecución Presupuestal"
            value={data.ejecucionPct}
            target={100}
            color={data.ejecucionPct <= 100 ? 'green' : 'red'}
          />
          <ProgressGauge
            label="OPs Cerradas"
            value={data.eficienciaOps}
            target={100}
            color={data.eficienciaOps >= 80 ? 'green' : data.eficienciaOps >= 50 ? 'yellow' : 'red'}
          />
          <ProgressGauge
            label="Desviación Permitida"
            value={Math.max(0, 10 - data.desviacionPct)}
            target={10}
            color={data.desviacionPct <= 5 ? 'green' : data.desviacionPct <= 10 ? 'yellow' : 'red'}
          />
        </div>
      </div>
    </div>
  );
}

function RatioCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'yellow' | 'neutral';
}) {
  const colorClasses = {
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    neutral: 'bg-muted text-foreground border-border',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium opacity-70">{title}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-70 mt-1">{subtitle}</p>
    </div>
  );
}

function RatioRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-medium tabular-nums ${highlight ? 'text-red-500' : ''}`}>{value}</span>
    </div>
  );
}

function ProgressGauge({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: 'green' | 'red' | 'yellow';
}) {
  const percentage = Math.min((value / target) * 100, 100);
  const colorClasses = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div className="text-center">
      <div className="relative w-32 h-32 mx-auto mb-2">
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${percentage * 2.51} 251`}
            className={colorClasses[color]}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{value.toFixed(0)}%</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
