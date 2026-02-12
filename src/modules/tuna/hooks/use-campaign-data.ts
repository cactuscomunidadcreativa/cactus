'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type {
  CampaignKPIs,
  ProductionOrder,
  ExpenseCategory,
  Alert,
  ProductionProcess,
} from '../types';

interface ProcessData {
  label: string;
  budget: number;
  actual: number;
}

interface DistributionData {
  label: string;
  value: number;
  color: string;
}

interface CategoryMapping {
  id: string;
  budget_category: string;
  budget_process: string;
  eeff_concept: string;
  confidence: number;
  match_type: string;
  confirmed: boolean;
}

interface EEFFTotal {
  eeff_concept: string;
  total_amount: number;
  almacigo_total: number;
  campo_total: number;
  packing_total: number;
}

interface UseCampaignDataReturn {
  // Data
  kpis: CampaignKPIs | null;
  orders: ProductionOrder[];
  processData: ProcessData[];
  distributionData: DistributionData[];
  alerts: Alert[];
  mappingStats: { total: number; confirmed: number; hasData: boolean };

  // State
  isLoading: boolean;
  error: string | null;
  hasData: boolean;

  // Actions
  refresh: () => Promise<void>;
}

const DISTRIBUTION_COLORS = [
  'hsl(340 82% 43%)', // Magenta TUNA
  'hsl(340 82% 55%)', // Magenta light
  'hsl(282 68% 38%)', // Purple
  'hsl(88 50% 53%)',  // Green
  'hsl(38 92% 50%)',  // Orange
  'hsl(200 80% 50%)', // Blue
];

const PROCESS_LABELS: Record<ProductionProcess, string> = {
  almacigo: 'Almácigo',
  campo_definitivo: 'Campo',
  packing: 'Packing',
};

export function useCampaignData(campaignId?: string): UseCampaignDataReturn {
  const [kpis, setKpis] = useState<CampaignKPIs | null>(null);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [processData, setProcessData] = useState<ProcessData[]>([]);
  const [distributionData, setDistributionData] = useState<DistributionData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [mappingStats, setMappingStats] = useState<{ total: number; confirmed: number; hasData: boolean }>({
    total: 0,
    confirmed: 0,
    hasData: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!campaignId || !supabase) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [ordersResult, budgetResult, alertsResult, mappingsResult, eeffTotalsResult] = await Promise.all([
        // Production orders
        supabase
          .from('tuna_production_orders')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('fecha', { ascending: false }),

        // Budget data
        supabase
          .from('tuna_budget')
          .select('*')
          .eq('campaign_id', campaignId),

        // Alerts
        supabase
          .from('tuna_alerts')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false })
          .limit(10),

        // Category mappings (confirmed ones)
        supabase
          .from('tuna_category_mappings')
          .select('*')
          .eq('campaign_id', campaignId),

        // EEFF totals by concept
        supabase
          .from('tuna_eeff_totals')
          .select('*')
          .eq('campaign_id', campaignId),
      ]);

      if (ordersResult.error) throw ordersResult.error;
      if (budgetResult.error) throw budgetResult.error;
      // Alerts and mappings are optional, don't throw on error

      // Process mappings and EEFF totals
      const mappings: CategoryMapping[] = mappingsResult.data || [];
      const eeffTotals: EEFFTotal[] = eeffTotalsResult.data || [];

      // Update mapping stats
      const confirmedMappings = mappings.filter(m => m.confirmed);
      setMappingStats({
        total: mappings.length,
        confirmed: confirmedMappings.length,
        hasData: mappings.length > 0,
      });

      // Create a map of EEFF concept -> totals
      const eeffTotalsMap: Record<string, EEFFTotal> = {};
      eeffTotals.forEach(t => {
        eeffTotalsMap[t.eeff_concept] = t;
      });

      // Create a map of budget category+process -> eeff concept (only confirmed)
      const mappingMap: Record<string, string> = {};
      confirmedMappings.forEach(m => {
        const key = `${m.budget_category}|${m.budget_process}`;
        mappingMap[key] = m.eeff_concept;
      });

      // Process orders
      const mappedOrders: ProductionOrder[] = (ordersResult.data || []).map((o) => ({
        id: o.id,
        numero: o.numero,
        tipo: o.tipo as 'A' | 'C' | 'P',
        fecha: new Date(o.fecha),
        fechaCierre: o.fecha_cierre ? new Date(o.fecha_cierre) : undefined,
        estado: o.estado,
        codigoProducto: o.codigo_producto || '',
        descripcion: o.descripcion || '',
        cantidadEstimada: parseFloat(o.cantidad_estimada) || 0,
        cantidadProducida: parseFloat(o.cantidad_producida) || 0,
        diferenciaCantidad: parseFloat(o.diferencia_cantidad) || 0,
        gastosPeriodo: o.gastos_periodo || {},
        gastosAcumulados: o.gastos_acumulados || {},
        costoUnitario: parseFloat(o.costo_unitario) || 0,
        costoTotal: parseFloat(o.costo_total) || 0,
        horasManoObra: parseFloat(o.horas_mano_obra) || 0,
      }));
      setOrders(mappedOrders);

      // Process budget data with mappings
      const budgetData = budgetResult.data || [];

      // Group by process
      const processTotals: Record<ProductionProcess, { budget: number; actual: number }> = {
        almacigo: { budget: 0, actual: 0 },
        campo_definitivo: { budget: 0, actual: 0 },
        packing: { budget: 0, actual: 0 },
      };

      // Group by category for distribution
      const categoryTotals: Record<string, number> = {};

      budgetData.forEach((b) => {
        const process = b.process as ProductionProcess;
        const budget = parseFloat(b.budget_usd) || 0;
        let actual = parseFloat(b.actual_usd) || 0;

        // If no actual value but we have confirmed mappings, calculate from EEFF totals
        if (actual === 0 && confirmedMappings.length > 0) {
          const mappingKey = `${b.category_name}|${b.process}`;
          const mappedConcept = mappingMap[mappingKey];

          if (mappedConcept && eeffTotalsMap[mappedConcept]) {
            const eeffTotal = eeffTotalsMap[mappedConcept];

            // Use the appropriate total based on process
            switch (process) {
              case 'almacigo':
                actual = eeffTotal.almacigo_total > 0 ? eeffTotal.almacigo_total : eeffTotal.total_amount;
                break;
              case 'campo_definitivo':
                actual = eeffTotal.campo_total > 0 ? eeffTotal.campo_total : eeffTotal.total_amount;
                break;
              case 'packing':
                actual = eeffTotal.packing_total > 0 ? eeffTotal.packing_total : eeffTotal.total_amount;
                break;
              default:
                actual = eeffTotal.total_amount;
            }
          }
        }

        if (processTotals[process]) {
          processTotals[process].budget += budget;
          processTotals[process].actual += actual;
        }

        // Group by category
        const category = b.category_name || 'Otros';
        if (!categoryTotals[category]) {
          categoryTotals[category] = 0;
        }
        categoryTotals[category] += actual || budget; // Use actual if available, otherwise budget
      });

      // Convert to arrays
      const processDataArray: ProcessData[] = Object.entries(processTotals)
        .filter(([_, data]) => data.budget > 0 || data.actual > 0)
        .map(([process, data]) => ({
          label: PROCESS_LABELS[process as ProductionProcess] || process,
          budget: data.budget,
          actual: data.actual,
        }));
      setProcessData(processDataArray);

      // Top 5 categories for distribution
      const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const distributionArray: DistributionData[] = sortedCategories.map(([label, value], idx) => ({
        label,
        value,
        color: DISTRIBUTION_COLORS[idx % DISTRIBUTION_COLORS.length],
      }));
      setDistributionData(distributionArray);

      // Calculate KPIs
      const totalBudget = Object.values(processTotals).reduce((sum, p) => sum + p.budget, 0);
      const totalActual = Object.values(processTotals).reduce((sum, p) => sum + p.actual, 0);
      const opsCerradas = mappedOrders.filter((o) => o.estado === 'cerrado').length;
      const opsAbiertas = mappedOrders.filter((o) => o.estado === 'en_proceso').length;
      const totalProducido = mappedOrders.reduce((sum, o) => sum + o.cantidadProducida, 0);
      const totalEstimado = mappedOrders.reduce((sum, o) => sum + o.cantidadEstimada, 0);
      const totalCosto = mappedOrders.reduce((sum, o) => sum + o.costoTotal, 0);

      const calculatedKpis: CampaignKPIs = {
        totalHectareas: 0, // TODO: Get from campaign config
        rendimientoPromedio: totalProducido > 0 ? totalProducido / Math.max(1, mappedOrders.length) : 0,
        produccionTotal: totalProducido,
        presupuestoTotal: totalBudget,
        gastoReal: totalActual > 0 ? totalActual : totalCosto,
        varianzaTotal: (totalActual || totalCosto) - totalBudget,
        varianzaPercent: totalBudget > 0 ? (((totalActual || totalCosto) - totalBudget) / totalBudget) * 100 : 0,
        ventasTotal: 0, // TODO: Get from export lots
        costoTotal: totalActual > 0 ? totalActual : totalCosto,
        utilidadBruta: 0, // TODO: Calculate from sales - costs
        margenBruto: 0,
        costoUnitarioPromedio: totalProducido > 0 ? totalCosto / totalProducido : 0,
        costoHectareaPromedio: 0, // TODO: Calculate
        opsAbiertas,
        opsCerradas,
      };
      setKpis(calculatedKpis);

      // Process alerts
      const mappedAlerts: Alert[] = (alertsResult.data || []).map((a) => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        message: a.message,
        relatedEntity: a.related_entity,
        createdAt: new Date(a.created_at),
        acknowledgedAt: a.acknowledged_at ? new Date(a.acknowledged_at) : undefined,
        acknowledgedBy: a.acknowledged_by,
      }));
      setAlerts(mappedAlerts);

    } catch (err) {
      console.error('Error fetching campaign data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hasData = orders.length > 0 || processData.length > 0 || distributionData.length > 0;

  return {
    kpis,
    orders,
    processData,
    distributionData,
    alerts,
    mappingStats,
    isLoading,
    error,
    hasData,
    refresh: fetchData,
  };
}
