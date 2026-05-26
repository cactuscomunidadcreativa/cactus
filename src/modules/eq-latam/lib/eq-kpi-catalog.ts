/**
 * Six Seconds Latam — KPI catalog.
 *
 * Static catalog of which KPIs each area tracks, their labels, units,
 * frequencies and (optional) baseline targets. Source: operating spec
 * section 8.
 *
 * Period semantics:
 *   - 'monthly' KPIs: period_label = 'YYYY-MM' (one value per month)
 *   - 'weekly'  KPIs: period_label = 'YYYY-Www' (ISO week)
 *
 * The frequency below is the RECOMMENDED reporting cadence. The UI lets
 * the user report at any cadence the KPI supports.
 */

import type { AreaId } from '../types/organization';

export type KpiUnit =
  | 'usd'
  | 'count'
  | 'percent'
  | 'days'
  | 'score'
  | 'ratio';

export type KpiFrequency = 'weekly' | 'monthly' | 'quarterly';

export interface KpiDefinition {
  code: string;
  area_id: AreaId;
  label: string;
  description: string;
  unit: KpiUnit;
  frequency: KpiFrequency;
  /** Higher is better? (affects visual indicator) */
  higher_is_better: boolean;
  /** Optional baseline target value. */
  target?: number;
}

export const KPI_CATALOG: KpiDefinition[] = [
  // ===== EDUCATION (Natalia / Andreia delivery) =====
  { code: 'pax_avg_event',       area_id: 'education', label: 'PAX promedio por evento', description: 'Σ PAX / # eventos del período', unit: 'count', frequency: 'monthly', higher_is_better: true, target: 13 },
  { code: 'events_on_time',      area_id: 'education', label: 'Eventos on-time',         description: '% eventos completados en fecha',     unit: 'percent', frequency: 'monthly', higher_is_better: true, target: 95 },
  { code: 'nps_attendees',       area_id: 'education', label: 'NPS asistentes',         description: 'Encuesta post-evento',                unit: 'score', frequency: 'monthly', higher_is_better: true, target: 70 },
  { code: 'completion_rate',     area_id: 'education', label: 'Tasa de finalización',   description: '% participantes que completan reports', unit: 'percent', frequency: 'monthly', higher_is_better: true, target: 90 },
  { code: 'cost_vs_budget',      area_id: 'education', label: 'Costo real vs presupuesto', description: 'Variance % entre costo y plan', unit: 'percent', frequency: 'monthly', higher_is_better: false, target: 5 },

  // ===== MARKETING (Karla) =====
  { code: 'leads_generated',     area_id: 'marketing', label: 'Leads generados',         description: 'Inputs nuevos al pipeline desde MKT', unit: 'count',   frequency: 'weekly',  higher_is_better: true,  target: 30 },
  { code: 'mqls',                area_id: 'marketing', label: 'MQLs',                    description: 'Marketing Qualified Leads',           unit: 'count',   frequency: 'weekly',  higher_is_better: true,  target: 10 },
  { code: 'cac',                 area_id: 'marketing', label: 'CAC',                     description: 'ADS spend / nuevos clientes',         unit: 'usd',     frequency: 'monthly', higher_is_better: false, target: 250 },
  { code: 'roas',                area_id: 'marketing', label: 'ROAS',                    description: 'Revenue MKT / ADS spend',             unit: 'ratio',   frequency: 'monthly', higher_is_better: true,  target: 4 },
  { code: 'ueq_delivered',       area_id: 'marketing', label: 'UEQ entregados (lead magnet)', description: 'Conteo de UEQs gratis distribuidos', unit: 'count', frequency: 'monthly', higher_is_better: true,  target: 50 },
  { code: 'ueq_to_cert_conv',    area_id: 'marketing', label: 'Conversión UEQ → cert',  description: '% UEQs que llevan a venta',           unit: 'percent', frequency: 'quarterly', higher_is_better: true, target: 8 },

  // ===== EQ BIZ (Andreia consulting) =====
  { code: 'pipeline_value',      area_id: 'eq_biz',    label: 'Pipeline value',          description: 'Σ deals abiertos',                    unit: 'usd',     frequency: 'weekly',  higher_is_better: true,  target: 50000 },
  { code: 'win_rate',            area_id: 'eq_biz',    label: 'Tasa de conversión',     description: 'Deals cerrados / oportunidades',      unit: 'percent', frequency: 'monthly', higher_is_better: true,  target: 25 },
  { code: 'sales_cycle_days',    area_id: 'eq_biz',    label: 'Ciclo promedio venta',    description: 'Días promedio (cierre - apertura)',   unit: 'days',    frequency: 'monthly', higher_is_better: false, target: 60 },
  { code: 'avg_deal_size',       area_id: 'eq_biz',    label: 'Average deal size',       description: 'Revenue / # deals',                   unit: 'usd',     frequency: 'monthly', higher_is_better: true,  target: 15000 },

  // ===== ASSESSMENTS =====
  { code: 'credits_sold',        area_id: 'assessments', label: 'Créditos vendidos',     description: 'Total créditos vendidos en el período', unit: 'count', frequency: 'monthly', higher_is_better: true,  target: 12000 },
  { code: 'credits_consumed',    area_id: 'assessments', label: 'Créditos consumidos',  description: 'Total créditos consumidos (reports generados)', unit: 'count', frequency: 'monthly', higher_is_better: true, target: 12000 },
  { code: 'graduate_calc_uses',  area_id: 'assessments', label: 'Usos de calc graduate', description: 'Sessions únicas en /eq-latam/calc',    unit: 'count', frequency: 'weekly',  higher_is_better: true,  target: 50 },

  // ===== IMPACT (Liliana + Otilia) =====
  { code: 'impact_people_reached', area_id: 'impact', label: 'Personas alcanzadas',     description: 'Beneficiarios de programas Impact',    unit: 'count',   frequency: 'monthly', higher_is_better: true,  target: 100 },
  { code: 'impact_scholarships',   area_id: 'impact', label: 'Becas otorgadas',         description: 'Personas con acceso subsidiado',       unit: 'count',   frequency: 'monthly', higher_is_better: true,  target: 5 },
  { code: 'impact_donations_usd',  area_id: 'impact', label: 'Donaciones recibidas',    description: 'Dinero recibido para Impact',          unit: 'usd',     frequency: 'monthly', higher_is_better: true,  target: 1500 },

  // ===== OPERATIONS (Liliana + Otilia + Natalia) =====
  { code: 'dso_days',            area_id: 'operations', label: 'DSO (días cobro)',       description: 'Días promedio entre factura y pago',  unit: 'days',    frequency: 'monthly', higher_is_better: false, target: 30 },
  { code: 'compliance_pct',      area_id: 'operations', label: 'Compliance a tiempo',    description: '% reportes a tiempo a 6S Global',     unit: 'percent', frequency: 'quarterly', higher_is_better: true, target: 100 },
  { code: 'inventory_credits',   area_id: 'operations', label: 'Créditos en inventario', description: 'Créditos comprados a Global y no vendidos', unit: 'count', frequency: 'monthly', higher_is_better: true, target: 5000 },
  { code: 'event_cost_variance', area_id: 'operations', label: 'Variance costo vs proyectado', description: 'Costo evento real vs plan',     unit: 'percent', frequency: 'monthly', higher_is_better: false, target: 5 },

  // ===== MEMBERSHIP =====
  { code: 'active_members',      area_id: 'membership', label: 'Miembros activos',       description: 'Miembros con suscripción activa',     unit: 'count',   frequency: 'monthly', higher_is_better: true,  target: 200 },
  { code: 'renewal_rate',        area_id: 'membership', label: 'Tasa de renovación',     description: '% renovaciones exitosas',             unit: 'percent', frequency: 'quarterly', higher_is_better: true, target: 85 },
  { code: 'membership_nps',      area_id: 'membership', label: 'NPS miembros',           description: 'Encuesta a miembros',                 unit: 'score',   frequency: 'quarterly', higher_is_better: true, target: 60 },

  // ===== PARTNERS =====
  { code: 'active_partners',     area_id: 'partners',  label: 'Partners activos',        description: 'Partners con al menos 1 deal en el período', unit: 'count', frequency: 'monthly', higher_is_better: true, target: 5 },
  { code: 'new_partners',        area_id: 'partners',  label: 'Nuevos partners activados', description: 'Partners con su primer deal cerrado', unit: 'count', frequency: 'monthly', higher_is_better: true, target: 1 },
  { code: 'tier_promotions',     area_id: 'partners',  label: 'Promociones de tier',     description: 'Partners que subieron de tier',       unit: 'count', frequency: 'monthly', higher_is_better: true, target: 1 },
];

export function kpisForArea(areaId: AreaId): KpiDefinition[] {
  return KPI_CATALOG.filter(k => k.area_id === areaId);
}

export function kpiByCode(code: string): KpiDefinition | undefined {
  return KPI_CATALOG.find(k => k.code === code);
}

// ============================================================
// PERIOD HELPERS — ISO week + month formatting
// ============================================================

export function currentMonth(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function currentIsoWeek(d: Date = new Date()): string {
  // Thursday-based ISO 8601 week calculation
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function listRecentMonths(n: number = 12): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    out.push(currentMonth(d));
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

export function listRecentWeeks(n: number = 12): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    out.push(currentIsoWeek(d));
    d.setDate(d.getDate() - 7);
  }
  return out;
}

// ============================================================
// FORMATTING
// ============================================================

export function formatKpiValue(value: number | null | undefined, unit: KpiUnit): string {
  if (value == null || isNaN(value)) return '—';
  switch (unit) {
    case 'usd':
      return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'days':
      return `${Math.round(value)}d`;
    case 'ratio':
      return `${value.toFixed(2)}×`;
    case 'score':
      return value.toFixed(0);
    case 'count':
    default:
      return Math.round(value).toLocaleString('en-US');
  }
}
