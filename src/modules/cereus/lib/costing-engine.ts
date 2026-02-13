/**
 * CEREUS Costing Engine
 * High-fashion garment costing with BOM calculation,
 * margin analysis, and Agave pricing integration.
 *
 * Formulas adapted from Agave's pricing engine for fashion context.
 */

import type {
  GarmentMaterial,
  Material,
  Variant,
  Garment,
  Workshop,
  MarginAnalysis,
  MarginDeviation,
} from '../types';

// ============================================================
// TYPES
// ============================================================

export interface CostBreakdown {
  materials: MaterialCostLine[];
  material_total: number;
  labor_hours: number;
  labor_cost: number;
  extras_cost: number;
  overhead: number;
  total_cost: number;
}

export interface MaterialCostLine {
  material_id: string;
  material_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  waste_factor: number;
  line_total: number;
  is_optional: boolean;
}

export interface PriceCalculation {
  cost: number;
  minimum_price: number;   // At minimum margin
  target_price: number;    // At target margin
  premium_price: number;   // At premium margin
  margin_at_price: number; // If price is given
  margin_category: string;
}

export interface MarginRange {
  name: string;
  nameEs: string;
  min: number;
  max: number;
  color: string;
}

// ============================================================
// CONSTANTS
// ============================================================

// Haute couture margin ranges (higher than Agave's commercial ranges)
export const CEREUS_MARGIN_RANGES: MarginRange[] = [
  { name: 'Critical', nameEs: 'Crítico', min: 0, max: 0.15, color: '#DC2626' },
  { name: 'Very Low', nameEs: 'Muy Bajo', min: 0.15, max: 0.25, color: '#EA580C' },
  { name: 'Low', nameEs: 'Bajo', min: 0.25, max: 0.35, color: '#F59E0B' },
  { name: 'Acceptable', nameEs: 'Aceptable', min: 0.35, max: 0.45, color: '#84CC16' },
  { name: 'Good', nameEs: 'Bueno', min: 0.45, max: 0.55, color: '#22C55E' },
  { name: 'Very Good', nameEs: 'Muy Bueno', min: 0.55, max: 0.65, color: '#14B8A6' },
  { name: 'Excellent', nameEs: 'Excelente', min: 0.65, max: 0.75, color: '#0EA5E9' },
  { name: 'Luxury', nameEs: 'Lujo', min: 0.75, max: 1, color: '#8B5CF6' },
];

// Default overhead percentage (workshop overhead, utilities, etc.)
export const DEFAULT_OVERHEAD_PERCENT = 0.12; // 12%

// Default waste factor for fabrics
export const DEFAULT_WASTE_FACTOR = 1.10; // 10%

// Complexity multipliers for labor
export const COMPLEXITY_MULTIPLIERS: Record<number, number> = {
  1: 1.0,   // Simple (basic shift dress)
  2: 1.25,  // Moderate (lined dress with zipper)
  3: 1.50,  // Complex (tailored suit)
  4: 2.0,   // Very Complex (couture gown with beading)
  5: 3.0,   // Extreme (haute couture with handwork)
};

// ============================================================
// COST CALCULATIONS
// ============================================================

/**
 * Calculate total cost from Bill of Materials
 */
export function calculateBOMCost(
  bom: GarmentMaterial[],
  materials: Material[]
): MaterialCostLine[] {
  return bom.map((entry) => {
    const material = materials.find(m => m.id === entry.material_id);
    const unitCost = entry.unit_cost || material?.unit_cost || 0;
    const wasteFactor = entry.waste_factor || DEFAULT_WASTE_FACTOR;
    const lineTotal = Math.round(entry.quantity * unitCost * wasteFactor * 100) / 100;

    return {
      material_id: entry.material_id,
      material_name: material?.name || 'Unknown',
      quantity: entry.quantity,
      unit: entry.unit,
      unit_cost: unitCost,
      waste_factor: wasteFactor,
      line_total: lineTotal,
      is_optional: entry.is_optional,
    };
  });
}

/**
 * Calculate full cost breakdown for a garment variant
 */
export function calculateCostBreakdown(
  garment: Garment,
  bom: GarmentMaterial[],
  materials: Material[],
  workshop?: Workshop | null,
  extrasOverride?: number,
  overheadPercent: number = DEFAULT_OVERHEAD_PERCENT
): CostBreakdown {
  // 1. Materials
  const materialLines = calculateBOMCost(bom, materials);
  const materialTotal = materialLines
    .filter(l => !l.is_optional)
    .reduce((sum, l) => sum + l.line_total, 0);

  // 2. Labor
  const complexityMultiplier = COMPLEXITY_MULTIPLIERS[garment.complexity_level] || 1;
  const laborHours = garment.base_labor_hours * complexityMultiplier;
  const hourlyRate = workshop?.labor_rate_hourly || 0;
  const laborCost = garment.base_labor_cost > 0
    ? garment.base_labor_cost * complexityMultiplier
    : Math.round(laborHours * hourlyRate * 100) / 100;

  // 3. Extras
  const extrasCost = extrasOverride || 0;

  // 4. Overhead
  const subtotal = materialTotal + laborCost + extrasCost;
  const overhead = Math.round(subtotal * overheadPercent * 100) / 100;

  // 5. Total
  const totalCost = Math.round((subtotal + overhead) * 100) / 100;

  return {
    materials: materialLines,
    material_total: Math.round(materialTotal * 100) / 100,
    labor_hours: Math.round(laborHours * 100) / 100,
    labor_cost: Math.round(laborCost * 100) / 100,
    extras_cost: Math.round(extrasCost * 100) / 100,
    overhead,
    total_cost: totalCost,
  };
}

// ============================================================
// PRICE CALCULATIONS (Agave-style)
// ============================================================

/**
 * Calculate price from cost and margin
 * Formula: Price = Cost / (1 - Margin)
 */
export function calculatePrice(cost: number, margin: number): number {
  if (margin >= 1) return Infinity;
  if (margin < 0) margin = 0;
  return Math.round((cost / (1 - margin)) * 100) / 100;
}

/**
 * Calculate margin from price and cost
 * Formula: Margin = (Price - Cost) / Price
 */
export function calculateMargin(price: number, cost: number): number {
  if (price <= 0) return 0;
  return Math.round(((price - cost) / price) * 10000) / 10000;
}

/**
 * Classify a margin into a category
 */
export function classifyMargin(
  margin: number,
  ranges: MarginRange[] = CEREUS_MARGIN_RANGES
): { category: string; categoryEs: string; color: string } {
  for (const range of ranges) {
    if (margin >= range.min && margin < range.max) {
      return { category: range.name, categoryEs: range.nameEs, color: range.color };
    }
  }
  const last = ranges[ranges.length - 1];
  if (margin >= last.max) {
    return { category: last.name, categoryEs: last.nameEs, color: last.color };
  }
  return { category: ranges[0].name, categoryEs: ranges[0].nameEs, color: ranges[0].color };
}

/**
 * Full price calculation for a garment
 */
export function calculatePricing(
  cost: number,
  marginConfig: { min: number; target: number; premium: number } = { min: 0.35, target: 0.50, premium: 0.65 }
): PriceCalculation {
  const minimumPrice = calculatePrice(cost, marginConfig.min);
  const targetPrice = calculatePrice(cost, marginConfig.target);
  const premiumPrice = calculatePrice(cost, marginConfig.premium);

  return {
    cost,
    minimum_price: minimumPrice,
    target_price: targetPrice,
    premium_price: premiumPrice,
    margin_at_price: 0,
    margin_category: '',
  };
}

/**
 * Calculate pricing with a specific final price
 */
export function calculatePricingAtPrice(
  cost: number,
  price: number,
  ranges: MarginRange[] = CEREUS_MARGIN_RANGES
): PriceCalculation {
  const margin = calculateMargin(price, cost);
  const classification = classifyMargin(margin, ranges);

  return {
    cost,
    minimum_price: calculatePrice(cost, 0.35),
    target_price: calculatePrice(cost, 0.50),
    premium_price: calculatePrice(cost, 0.65),
    margin_at_price: margin,
    margin_category: classification.category,
  };
}

// ============================================================
// VARIANT PRICING
// ============================================================

/**
 * Calculate variant total cost and suggested price
 */
export function calculateVariantPricing(
  costBreakdown: CostBreakdown,
  marginConfig: { min: number; target: number; premium: number }
): {
  total_cost: number;
  prices: PriceCalculation;
  breakdown: CostBreakdown;
} {
  const pricing = calculatePricing(costBreakdown.total_cost, marginConfig);

  return {
    total_cost: costBreakdown.total_cost,
    prices: pricing,
    breakdown: costBreakdown,
  };
}

// ============================================================
// MARGIN ANALYSIS (Post-delivery)
// ============================================================

/**
 * Analyze margin deviation between planned and actual
 */
export function analyzeMarginDeviation(
  planned: {
    material_cost: number;
    labor_cost: number;
    overhead: number;
    price: number;
  },
  actual: {
    material_cost: number;
    labor_cost: number;
    overhead: number;
    price: number;
  }
): Omit<MarginAnalysis, 'id' | 'order_id' | 'analyzed_at'> {
  const plannedTotal = planned.material_cost + planned.labor_cost + planned.overhead;
  const actualTotal = actual.material_cost + actual.labor_cost + actual.overhead;

  const plannedMargin = calculateMargin(planned.price, plannedTotal);
  const actualMargin = calculateMargin(actual.price, actualTotal);

  const costDeviation = actualTotal - plannedTotal;
  const costDeviationPercent = plannedTotal > 0
    ? Math.round((costDeviation / plannedTotal) * 10000) / 10000
    : 0;

  const deviations: MarginDeviation[] = [];

  if (actual.material_cost !== planned.material_cost) {
    deviations.push({
      category: 'material',
      reason: actual.material_cost > planned.material_cost
        ? 'Material cost increase'
        : 'Material cost savings',
      amount: actual.material_cost - planned.material_cost,
    });
  }

  if (actual.labor_cost !== planned.labor_cost) {
    deviations.push({
      category: 'labor',
      reason: actual.labor_cost > planned.labor_cost
        ? 'Additional labor required'
        : 'Labor efficiency gains',
      amount: actual.labor_cost - planned.labor_cost,
    });
  }

  if (actual.overhead !== planned.overhead) {
    deviations.push({
      category: 'overhead',
      reason: 'Overhead adjustment',
      amount: actual.overhead - planned.overhead,
    });
  }

  return {
    planned_material_cost: planned.material_cost,
    planned_labor_cost: planned.labor_cost,
    planned_overhead: planned.overhead,
    planned_total_cost: plannedTotal,
    planned_price: planned.price,
    planned_margin: plannedMargin,

    actual_material_cost: actual.material_cost,
    actual_labor_cost: actual.labor_cost,
    actual_overhead: actual.overhead,
    actual_total_cost: actualTotal,
    actual_price: actual.price,
    actual_margin: actualMargin,

    cost_deviation: Math.round(costDeviation * 100) / 100,
    cost_deviation_percent: costDeviationPercent,
    margin_deviation: Math.round((actualMargin - plannedMargin) * 10000) / 10000,

    deviation_reasons: deviations,
    recommendations: generateMarginRecommendations(plannedMargin, actualMargin, deviations),
  };
}

/**
 * Generate human-readable recommendations based on margin analysis
 */
function generateMarginRecommendations(
  plannedMargin: number,
  actualMargin: number,
  deviations: MarginDeviation[]
): string {
  const parts: string[] = [];

  if (actualMargin < plannedMargin) {
    parts.push(`Margin decreased from ${formatPercent(plannedMargin)} to ${formatPercent(actualMargin)}.`);

    const materialDev = deviations.find(d => d.category === 'material' && d.amount > 0);
    if (materialDev) {
      parts.push(`Material costs exceeded plan by $${materialDev.amount.toFixed(2)}. Consider negotiating supplier prices or adjusting BOM.`);
    }

    const laborDev = deviations.find(d => d.category === 'labor' && d.amount > 0);
    if (laborDev) {
      parts.push(`Labor exceeded plan by $${laborDev.amount.toFixed(2)}. Review complexity estimates for similar garments.`);
    }
  } else if (actualMargin > plannedMargin) {
    parts.push(`Margin improved from ${formatPercent(plannedMargin)} to ${formatPercent(actualMargin)}. Good cost management.`);
  } else {
    parts.push('Margin met plan exactly.');
  }

  return parts.join(' ');
}

// ============================================================
// FORMATTING HELPERS
// ============================================================

export function formatPrice(price: number, currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    USD: '$',
    MXN: '$',
    EUR: '€',
    PEN: 'S/',
    COP: '$',
  };
  const symbol = symbols[currency] || '$';
  return `${symbol}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number): string {
  const pct = value < 1 ? value * 100 : value;
  return `${pct.toFixed(1)}%`;
}

export function getMarginEmoji(margin: number): string {
  if (margin < 0.15) return '🔴';
  if (margin < 0.25) return '🟠';
  if (margin < 0.35) return '🟡';
  if (margin < 0.45) return '🟢';
  if (margin < 0.55) return '✅';
  if (margin < 0.65) return '💚';
  if (margin < 0.75) return '💎';
  return '👑';
}
