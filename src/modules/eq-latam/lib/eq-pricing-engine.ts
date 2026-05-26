/**
 * EQ LATAM Pricing Engine - Pure calculations (NO AI)
 * All price calculations are done mathematically.
 */

import type {
  CertificationId,
  PackId,
  Modality,
  TrainerRole,
  ViabilityLevel,
  PricingResult,
  PackPricingResult,
  EventAnalysis,
  AnnualSimulation,
  EventPlan,
  MarketComparison,
  PartnerProposal,
  PartnerProposalItem,
} from '../types';

import {
  ON_DEMAND_COSTS,
  GROUP_ONLINE_COSTS,
  GROUP_ONLINE_PACKS,
  IN_PERSON_MT_CERTS,
  IN_PERSON_MT_PACKS,
  IN_PERSON_RF_CERTS,
  IN_PERSON_RF_PACKS,
  PRICING_RULES,
  ANNUAL_BUDGET,
  MARKET_PRICES,
  MASTER_PRICE_LIST,
  PACK_DEFINITIONS,
  CERT_NAMES,
  MODALITY_LABELS,
} from './eq-data';

// ============================================================
// CORE PRICING FUNCTIONS
// ============================================================

/**
 * Calculate suggested price (+25%, rounded to $5)
 */
export function pvpSugerido(pvpMin: number): number {
  return roundTo(pvpMin * (1 + PRICING_RULES.suggestedMarkup), PRICING_RULES.roundingNearest);
}

/**
 * Calculate partner price (-30%, rounded to $5)
 */
export function precioPartner(pvpMin: number): number {
  return roundTo(pvpMin * (1 - PRICING_RULES.partnerDiscount), PRICING_RULES.roundingNearest);
}

/**
 * Net after distribution (50%)
 */
export function neto6S(pvpSug: number): number {
  return Math.round(pvpSug * (1 - PRICING_RULES.distributionTotal) * 100) / 100;
}

/**
 * Net margin: (pvpSug - cost) / pvpSug
 */
export function margenNeto(pvpSug: number, costoTotal: number): number {
  if (pvpSug <= 0) return 0;
  return Math.round(((pvpSug - costoTotal) / pvpSug) * 10000) / 10000;
}

/**
 * Director compensation: $18,000 retainer + 10% of gross
 */
export function calcularCompDirector(ingresoBruto: number): {
  retainer: number;
  comision: number;
  total: number;
} {
  const retainer = 18000;
  const comision = Math.round(ingresoBruto * 0.10 * 100) / 100;
  return { retainer, comision, total: retainer + comision };
}

// ============================================================
// CERTIFICATION PRICING
// ============================================================

/**
 * Get pricing for a single certification
 */
export function calcularPrecioCert(
  certId: CertificationId,
  modality: Modality,
  pax: number,
  trainerRole?: TrainerRole,
): PricingResult {
  const market = MARKET_PRICES.find(m => m.certId === certId);
  const global6S = market?.globalOnline ?? 0;

  let costoReal: number;

  if (modality === 'on_demand') {
    const data = ON_DEMAND_COSTS.find(c => c.certId === certId);
    if (!data) throw new Error(`No on-demand data for ${certId}`);
    costoReal = data.pvpMinimo; // pvpMinimo IS the cost per pax for on-demand
  } else if (modality === 'group_online') {
    const data = GROUP_ONLINE_COSTS.find(c => c.certId === certId);
    if (!data) throw new Error(`No group-online data for ${certId}`);
    costoReal = lookupPaxPrice(data.preciosPorPax, pax);
  } else {
    // In-person MT or RF
    const role = trainerRole ?? (modality === 'in_person_mt' ? 'MT' : 'RF');
    const source = role === 'MT' ? IN_PERSON_MT_CERTS : IN_PERSON_RF_CERTS;
    const data = source.find(c => c.id === certId);
    if (!data) throw new Error(`No in-person ${role} data for ${certId}`);
    costoReal = lookupPaxPrice(data.preciosPorPax, pax);
  }

  const pvpMin = costoReal;
  const pvpSug = pvpSugerido(pvpMin);
  const partner = precioPartner(pvpMin);
  const net = neto6S(pvpSug);
  const margen = margenNeto(pvpSug, costoReal);
  const margenP = margenNeto(partner, costoReal);
  const descVsGlobal = global6S > 0
    ? Math.round(((global6S - pvpSug) / global6S) * 100)
    : 0;

  return {
    certId,
    modality,
    trainerRole,
    pax,
    costoReal,
    pvpMinimo: pvpMin,
    pvpSugerido: pvpSug,
    precioPartner: partner,
    precio6SGlobal: global6S,
    margenSugerido: margen,
    margenPartner: margenP,
    neto6S: net,
    totalRevenueSugerido: pvpSug * pax,
    totalRevenuePartner: partner * pax,
    descuentoVsGlobal: descVsGlobal,
    viable: pvpSug >= costoReal,
    deficit: pvpSug < costoReal ? (costoReal - pvpSug) * pax : undefined,
  };
}

/**
 * Get pricing for a pack
 */
export function calcularPrecioPack(
  packId: PackId,
  modality: Modality,
  pax: number,
  trainerRole?: TrainerRole,
): PackPricingResult {
  const packDef = PACK_DEFINITIONS[packId];
  if (!packDef) throw new Error(`Unknown pack: ${packId}`);

  let costoPorPax: number;
  let costoFijoTotal = 0;
  let costoMaterialesTotal = 0;
  let costoVariableTotal = 0;

  if (modality === 'group_online') {
    const packData = GROUP_ONLINE_PACKS.find(p => p.packId === packId);
    if (packData) {
      costoPorPax = lookupPaxPrice(packData.preciosPorPax, pax);
      costoFijoTotal = packData.costoFijo;
      costoVariableTotal = packData.costoVariablePorPax * pax;
    } else {
      // Sum individual certs
      costoPorPax = packDef.certs.reduce((sum, certId) => {
        const data = GROUP_ONLINE_COSTS.find(c => c.certId === certId);
        if (!data) return sum;
        return sum + lookupPaxPrice(data.preciosPorPax, pax);
      }, 0);
    }
  } else if (modality === 'in_person_mt' || modality === 'in_person_rf') {
    const role = trainerRole ?? (modality === 'in_person_mt' ? 'MT' : 'RF');
    const packSource = role === 'MT' ? IN_PERSON_MT_PACKS : IN_PERSON_RF_PACKS;
    const packData = packSource.find(p => p.id === packId);

    if (packData) {
      costoPorPax = lookupPaxPrice(packData.preciosPorPax, pax);
      costoFijoTotal = packData.costoFijo;
      costoMaterialesTotal = packData.materialsPorPax * pax;
      costoVariableTotal = packData.costoVariablePorPax * pax;
    } else {
      // Sum individual certs
      const certSource = role === 'MT' ? IN_PERSON_MT_CERTS : IN_PERSON_RF_CERTS;
      costoPorPax = packDef.certs.reduce((sum, certId) => {
        const data = certSource.find(c => c.id === certId);
        if (!data) return sum;
        return sum + lookupPaxPrice(data.preciosPorPax, pax);
      }, 0);
    }
  } else {
    // On-demand: sum individual costs
    costoPorPax = packDef.certs.reduce((sum, certId) => {
      const data = ON_DEMAND_COSTS.find(c => c.certId === certId);
      return sum + (data?.pvpMinimo ?? 0);
    }, 0);
  }

  const costoEntregaTotal = costoFijoTotal + costoMaterialesTotal + costoVariableTotal;
  const totalCosto = costoPorPax * pax;
  const pvpSug = pvpSugerido(costoPorPax);
  const partner = precioPartner(costoPorPax);
  const totalSugerido = pvpSug * pax;
  const totalPartner = partner * pax;
  const net = neto6S(pvpSug);
  const margen = margenNeto(pvpSug, costoPorPax);
  const margenNet = (net * pax - costoEntregaTotal) / (pvpSug * pax);

  const viability = assessViability(totalSugerido, costoEntregaTotal || totalCosto);

  return {
    packId,
    certIds: packDef.certs,
    modality,
    trainerRole,
    pax,
    costoFijoTotal,
    costoMaterialesTotal,
    costoVariableTotal,
    costoEntregaTotal: costoEntregaTotal || totalCosto,
    costoPorPax,
    pvpMinimoPorPax: costoPorPax,
    pvpSugeridoPorPax: pvpSug,
    precioPartnerPorPax: partner,
    totalCosto,
    totalSugerido,
    totalPartner,
    margenSugerido: margen,
    neto6S: net * pax,
    margenNeto: margenNet,
    viability: viability.level,
    viabilityReason: viability.reason,
  };
}

// ============================================================
// EVENT ANALYSIS
// ============================================================

/**
 * Analyze a full event (e.g., EQ Week)
 */
export function analizarEvento(
  packId: PackId,
  modality: Modality,
  pax: number,
  trainerRole: TrainerRole,
  isEqWeek: boolean = false,
): EventAnalysis {
  const role = trainerRole;
  const packSource = role === 'MT' ? IN_PERSON_MT_PACKS : IN_PERSON_RF_PACKS;
  const packData = packSource.find(p => p.id === packId);

  let costoFijo = 0;
  let costoMateriales = 0;
  let costoVariable = 0;

  if (packData) {
    costoFijo = packData.costoFijo;
    costoMateriales = packData.materialsPorPax * pax;
    costoVariable = packData.costoVariablePorPax * pax;
  } else {
    // Build from individual certs
    const packDef = PACK_DEFINITIONS[packId];
    const certSource = role === 'MT' ? IN_PERSON_MT_CERTS : IN_PERSON_RF_CERTS;
    for (const certId of packDef.certs) {
      const cert = certSource.find(c => c.id === certId);
      if (cert) {
        costoFijo += cert.costoFijo;
        costoMateriales += cert.materialsPorPax * pax;
        costoVariable += cert.costoVariablePorPax * pax;
      }
    }
  }

  const costoEntrega = costoFijo + costoMateriales + costoVariable;
  const costoPorPax = costoEntrega / pax;

  const pvpSug = pvpSugerido(costoPorPax);
  const partner = precioPartner(costoPorPax);
  const ingresoSugerido = pvpSug * pax;
  const ingresoPartner = partner * pax;
  const neto = neto6S(pvpSug) * pax;
  const margenNeto_ = costoEntrega > 0 ? (neto - costoEntrega) / ingresoSugerido : 0;

  // Viability based on net vs delivery cost
  let viability: ViabilityLevel;
  let viabilityReason: string;

  if (neto >= costoEntrega) {
    viability = 'GO';
    viabilityReason = `Evento viable. Margen neto: $${formatPrice(neto - costoEntrega)}`;
  } else if (neto >= costoEntrega * 0.8) {
    viability = 'MARGINAL';
    viabilityReason = `Marginal. Deficit de $${formatPrice(costoEntrega - neto)}. Necesita complementar con otros ingresos.`;
  } else {
    viability = 'NO_GO';
    viabilityReason = `NO VIABLE. Deficit de $${formatPrice(costoEntrega - neto)}. Precio minimo autosustentable: $${formatPrice(costoEntrega / pax / (1 - PRICING_RULES.distributionTotal))}/PAX`;
  }

  // Break-even calculations
  const precioMinimoAutosustentable = Math.ceil((costoEntrega / pax) / (1 - PRICING_RULES.distributionTotal));
  const paxMinimo = pvpSug > 0
    ? Math.ceil(costoEntrega / (neto6S(pvpSug)))
    : 999;

  return {
    packId,
    modality,
    trainerRole,
    pax,
    isEqWeek,
    costoFijo,
    costoMateriales,
    costoVariable,
    costoEntrega,
    ingresoSugerido,
    ingresoPartner,
    neto6SSugerido: neto,
    margenNetoEvento: Math.round(margenNeto_ * 10000) / 10000,
    viability,
    viabilityReason,
    precioMinimoAutosustentable,
    paxMinimoParaViabilidad: paxMinimo,
  };
}

// ============================================================
// ANNUAL SIMULATION
// ============================================================

/**
 * Simulate annual revenue from a set of planned events
 */
export function simularAnual(events: EventPlan[]): AnnualSimulation {
  let totalRevenue = 0;
  let totalCosts = 0;

  for (const event of events) {
    totalRevenue += event.revenue;
    totalCosts += event.cost;
  }

  const totalProfit = totalRevenue - totalCosts;
  const budgetGap = ANNUAL_BUDGET.certMustCoverNet;
  const netFromCerts = totalRevenue * (1 - PRICING_RULES.distributionTotal);
  const gapCovered = Math.min(netFromCerts, budgetGap);
  const gapRemaining = Math.max(0, budgetGap - netFromCerts);
  const coveragePercent = budgetGap > 0 ? Math.round((gapCovered / budgetGap) * 100) : 100;
  const directorComp = calcularCompDirector(totalRevenue);
  const isSustainable = gapRemaining === 0;

  let recommendation: string;
  if (isSustainable) {
    recommendation = `Plan viable. Las certificaciones cubren el gap de $${formatPrice(budgetGap)} con un superavit de $${formatPrice(netFromCerts - budgetGap)}.`;
  } else {
    recommendation = `Faltan $${formatPrice(gapRemaining)} para cubrir el gap. Opciones: agregar eventos, aumentar PAX, o subir precios.`;
  }

  return {
    events,
    totalCertRevenue: totalRevenue,
    totalCertCosts: totalCosts,
    totalCertProfit: totalProfit,
    budgetGap,
    gapCovered,
    gapRemaining,
    coveragePercent,
    directorComp: directorComp.total,
    isSustainable,
    recommendation,
  };
}

// ============================================================
// MARKET COMPARISON
// ============================================================

/**
 * Compare a certification against 6S Global
 */
export function compararMercado(certId: CertificationId): MarketComparison {
  const master = MASTER_PRICE_LIST[certId];
  const market = MARKET_PRICES.find(m => m.certId === certId);
  const global6S = market?.globalOnline ?? 0;
  const eqPrice = master?.pvpSugerido ?? 0;

  const diferencia = global6S - eqPrice;
  const diferenciaPct = global6S > 0 ? Math.round((diferencia / global6S) * 100) : 0;

  let posicion: MarketComparison['posicion'];
  if (diferenciaPct >= 50) posicion = 'muy_accesible';
  else if (diferenciaPct >= 30) posicion = 'accesible';
  else if (diferenciaPct >= 10) posicion = 'competitivo';
  else posicion = 'muy_competitivo';

  return {
    certId,
    eqLatamSugerido: eqPrice,
    global6SOnline: global6S,
    diferencia,
    diferenciaPct,
    posicion,
  };
}

/**
 * Get all market comparisons
 */
export function compararMercadoCompleto(): MarketComparison[] {
  return (['UEQ', 'BPC', 'EQAC', 'EQPC', 'EQPM'] as CertificationId[]).map(compararMercado);
}

// ============================================================
// PARTNER PROPOSAL
// ============================================================

/**
 * Generate a partner proposal
 */
export function generarPropuestaPartner(
  partnerName: string,
  items: PartnerProposalItem[],
): PartnerProposal {
  const totalInversion = items.reduce((sum, i) => sum + i.totalPartner, 0);
  const totalPublico = items.reduce((sum, i) => sum + i.totalPublico, 0);
  const totalAhorro = totalPublico - totalInversion;
  const ahorroPct = totalPublico > 0 ? Math.round((totalAhorro / totalPublico) * 100) : 0;

  return {
    partnerName,
    date: new Date().toISOString().split('T')[0],
    items,
    totalInversion,
    totalAhorro,
    ahorroPct,
    validezDias: 30,
  };
}

// ============================================================
// BUDGET OVERVIEW
// ============================================================

/**
 * Get full budget breakdown
 */
export function getBudgetOverview() {
  const fixedTotal = ANNUAL_BUDGET.fixedCosts.reduce((sum, c) => sum + c.amount, 0);
  const byCategory = {
    team: ANNUAL_BUDGET.fixedCosts.filter(c => c.category === 'team').reduce((s, c) => s + c.amount, 0),
    operations: ANNUAL_BUDGET.fixedCosts.filter(c => c.category === 'operations').reduce((s, c) => s + c.amount, 0),
    marketing: ANNUAL_BUDGET.fixedCosts.filter(c => c.category === 'marketing').reduce((s, c) => s + c.amount, 0),
    shared: ANNUAL_BUDGET.fixedCosts.filter(c => c.category === 'shared').reduce((s, c) => s + c.amount, 0),
  };

  return {
    totalCosts: ANNUAL_BUDGET.totalAnnualCosts,
    fixedCosts: fixedTotal,
    variableCosts: ANNUAL_BUDGET.variableCosts,
    byCategory,
    nonCertIncome: ANNUAL_BUDGET.nonCertIncome,
    totalNonCertIncome: ANNUAL_BUDGET.totalNonCertIncome,
    certGap: ANNUAL_BUDGET.certMustCoverNet,
    fixedCostItems: ANNUAL_BUDGET.fixedCosts,
  };
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function roundTo(value: number, nearest: number): number {
  return Math.round(value / nearest) * nearest;
}

function lookupPaxPrice(table: Record<number, number>, pax: number): number {
  if (table[pax] !== undefined) return table[pax];

  // Interpolate between nearest known values
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);

  if (pax <= keys[0]) return table[keys[0]];
  if (pax >= keys[keys.length - 1]) return table[keys[keys.length - 1]];

  // Find surrounding keys
  let lower = keys[0];
  let upper = keys[keys.length - 1];
  for (const k of keys) {
    if (k <= pax) lower = k;
    if (k >= pax && k < upper) { upper = k; break; }
  }

  if (lower === upper) return table[lower];

  // Linear interpolation
  const ratio = (pax - lower) / (upper - lower);
  return Math.round((table[lower] + (table[upper] - table[lower]) * ratio) * 100) / 100;
}

function assessViability(revenue: number, cost: number): { level: ViabilityLevel; reason: string } {
  const net = revenue * (1 - PRICING_RULES.distributionTotal);
  const margin = net - cost;

  if (margin >= 0) {
    return { level: 'GO', reason: `Viable. Margen: $${formatPrice(margin)}` };
  } else if (margin >= -cost * 0.2) {
    return { level: 'MARGINAL', reason: `Marginal. Deficit: $${formatPrice(Math.abs(margin))}` };
  } else {
    return { level: 'NO_GO', reason: `No viable. Deficit: $${formatPrice(Math.abs(margin))}` };
  }
}

/**
 * Format price for display
 */
export function formatPrice(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/**
 * Format price with dollar sign
 */
export function formatPriceUSD(amount: number): string {
  return `$${formatPrice(amount)}`;
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  const pct = value < 1 ? value * 100 : value;
  return `${pct.toFixed(1)}%`;
}

/**
 * Get viability color
 */
export function getViabilityColor(level: ViabilityLevel): string {
  const colors: Record<ViabilityLevel, string> = {
    GO: '#22C55E',
    MARGINAL: '#F59E0B',
    NO_GO: '#EF4444',
  };
  return colors[level];
}

/**
 * Get viability label
 */
export function getViabilityLabel(level: ViabilityLevel): string {
  const labels: Record<ViabilityLevel, string> = {
    GO: 'VIABLE',
    MARGINAL: 'MARGINAL',
    NO_GO: 'NO VIABLE',
  };
  return labels[level];
}

/**
 * Get position label
 */
export function getPositionLabel(posicion: MarketComparison['posicion']): string {
  const labels: Record<string, string> = {
    muy_competitivo: 'Muy Competitivo',
    competitivo: 'Competitivo',
    accesible: 'Accesible',
    muy_accesible: 'Muy Accesible',
  };
  return labels[posicion] || posicion;
}

/**
 * Get position color
 */
export function getPositionColor(posicion: MarketComparison['posicion']): string {
  const colors: Record<string, string> = {
    muy_competitivo: '#22C55E',
    competitivo: '#84CC16',
    accesible: '#3B82F6',
    muy_accesible: '#8B5CF6',
  };
  return colors[posicion] || '#6B7280';
}

/**
 * Get certification display name
 */
export function getCertName(certId: CertificationId): string {
  return CERT_NAMES[certId]?.short ?? certId;
}

/**
 * Get pack display name
 */
export function getPackName(packId: PackId): string {
  return PACK_DEFINITIONS[packId]?.name ?? packId;
}

/**
 * Get modality display name
 */
export function getModalityName(modality: Modality): string {
  return MODALITY_LABELS[modality] ?? modality;
}

// ============================================================================
// V2 ENGINE — Per-deal contribution under 2026 cash distribution model.
//
// This is the source of truth going forward. Old functions above are kept
// for the legacy dashboard tabs until they migrate to the new model.
// ============================================================================

import type {
  Deal,
  DealContribution,
  LicensingMode,
} from '../types';
import {
  DISTRIBUTION_STRUCTURE,
  EQ_WEEK_COST_MODEL,
  DEFAULT_LICENSING_MODE,
  FULL_EQ_WEEK_PARTNER_WHOLESALE_PRICES,
} from './eq-data';
import {
  calcCertFacilitationCost,
  bundleIncludesMerch,
  HOURLY_RATE_GROUP_DEFAULT_USD,
  getPackHours,
} from './eq-cost-catalog';

/**
 * Resolves the wholesale price for a Full EQ Week deal by PAX.
 * Falls back to linear interpolation between defined PAX tiers.
 */
export function resolveFullEqWeekWholesalePrice(pax: number): number {
  const tiers = Object.keys(FULL_EQ_WEEK_PARTNER_WHOLESALE_PRICES)
    .map(Number)
    .sort((a, b) => a - b);
  if (pax <= tiers[0]) return FULL_EQ_WEEK_PARTNER_WHOLESALE_PRICES[tiers[0]];
  if (pax >= tiers[tiers.length - 1]) {
    return FULL_EQ_WEEK_PARTNER_WHOLESALE_PRICES[tiers[tiers.length - 1]];
  }
  for (let i = 0; i < tiers.length - 1; i++) {
    if (pax >= tiers[i] && pax <= tiers[i + 1]) {
      const lo = tiers[i];
      const hi = tiers[i + 1];
      const loPrice = FULL_EQ_WEEK_PARTNER_WHOLESALE_PRICES[lo];
      const hiPrice = FULL_EQ_WEEK_PARTNER_WHOLESALE_PRICES[hi];
      const ratio = (pax - lo) / (hi - lo);
      return loPrice + (hiPrice - loPrice) * ratio;
    }
  }
  return FULL_EQ_WEEK_PARTNER_WHOLESALE_PRICES[15];
}

/**
 * Computes the delivery cost for a deal. Currently optimized for FULL_EQ_WEEK;
 * other products go through calcCertFacilitationCost.
 */
export function calcDeliveryCost(deal: Deal, pax: number): {
  facilitation: number;
  materials_kit: number;
  merch: number;
  merch_hidden_margin: number;
  travel: number;
  credits: number;
  total: number;
} {
  const travel = deal.travel_usd ?? EQ_WEEK_COST_MODEL.default_travel_usd;
  const credits = 0; // covered by annual maintenance to 6S Global

  if (deal.product_code === 'FULL_EQ_WEEK') {
    const facilitation =
      EQ_WEEK_COST_MODEL.facilitation_days *
      EQ_WEEK_COST_MODEL.facilitation_per_day_usd;
    const materials_kit = EQ_WEEK_COST_MODEL.materials_kit_per_pax_usd * pax;
    const merch = EQ_WEEK_COST_MODEL.merch_per_pax_usd * pax; // Full EQ Week incluye EQPC + EQPM
    const merch_hidden_margin =
      (EQ_WEEK_COST_MODEL.merch_retail_value_per_pax_usd -
        EQ_WEEK_COST_MODEL.merch_per_pax_usd) *
      pax;
    return {
      facilitation,
      materials_kit,
      merch,
      merch_hidden_margin,
      travel,
      credits,
      total: facilitation + materials_kit + merch + travel + credits,
    };
  }

  // Pack online grupal — sum of facilitation hours × $50/hr (no merch, no travel default)
  // Caller can override travel_usd if a pack happens to be in-person.
  // Hide merch unless explicitly Full EQ Week.
  // (Standalone certs use this path too via product_code = cert id.)
  let facilitation = 0;
  const packHours = getPackHours(
    deal.product_code as PackId,
    deal.modality,
  );
  if (packHours) {
    facilitation = packHours.total_facilitation_hours * HOURLY_RATE_GROUP_DEFAULT_USD;
  } else {
    facilitation = calcCertFacilitationCost(
      deal.product_code as CertificationId,
      deal.modality,
    );
  }
  const materials_kit = 0;
  const merch = 0;
  const merch_hidden_margin = 0;
  return {
    facilitation,
    materials_kit,
    merch,
    merch_hidden_margin,
    travel: 0, // online by default; caller overrides for in-person
    credits,
    total: facilitation,
  };
}

/**
 * Computes the full contribution breakdown for a deal under the active
 * licensing mode.
 *
 * Cash distribution rules:
 *   - Karla 3% if marketing_origin
 *   - Closer 5% (or override up to 7%)
 *   - Referrer 10% (or per-deal override) if channel = 'referrer'
 *   - 6S Global: 0 if annual_flat mode, else 30% × revenue
 */
export function calcularContribucion(
  deal: Deal,
  licensingMode: LicensingMode = DEFAULT_LICENSING_MODE,
): DealContribution {
  const pax = deal.pax_actual ?? deal.pax_expected;

  // Revenue: partner channel uses wholesale, others use retail.
  const pricePerPax =
    deal.channel === 'partner'
      ? (deal.wholesale_price_per_pax_usd ??
          resolveFullEqWeekWholesalePrice(pax))
      : deal.retail_price_per_pax_usd;
  const revenue = pricePerPax * pax;

  // Karla 3% (only if marketing origin)
  const karla = deal.marketing_origin
    ? revenue * DISTRIBUTION_STRUCTURE.karlaMarketing
    : 0;

  // Closer 5% (or override up to 7%, validated)
  const closerPct = Math.min(
    deal.closer_commission_pct,
    DISTRIBUTION_STRUCTURE.closerOverrideMax,
  );
  const closer = revenue * closerPct;

  // Referrer 10% (only when channel = referrer)
  const referrerPct =
    deal.referrer_commission_pct_override ??
    DISTRIBUTION_STRUCTURE.referrerDefault;
  const referrer =
    deal.channel === 'referrer' ? revenue * referrerPct : 0;

  // 6S Global licensing — depends on mode
  const licensing =
    licensingMode.type === 'percentage_of_revenue'
      ? revenue * licensingMode.rate
      : 0; // annual_flat: already in burn fijo, not per-deal

  const total_cash_distribution = karla + closer + referrer + licensing;

  const delivery = calcDeliveryCost(deal, pax);

  const contribution = revenue - total_cash_distribution - delivery.total;
  const margin_pct = revenue > 0 ? contribution / revenue : 0;

  return {
    deal_id: deal.id,
    pax,
    revenue_usd: revenue,
    karla_marketing_usd: karla,
    closer_usd: closer,
    referrer_usd: referrer,
    licensing_global_usd: licensing,
    total_cash_distribution_usd: total_cash_distribution,
    facilitation_usd: delivery.facilitation,
    materials_kit_usd: delivery.materials_kit,
    merch_usd: delivery.merch,
    merch_hidden_margin_usd: delivery.merch_hidden_margin,
    travel_usd: delivery.travel,
    credits_cost_usd: delivery.credits,
    total_delivery_cost_usd: delivery.total,
    contribution_usd: contribution,
    margin_pct,
  };
}

/**
 * Runs the 4 PAX scenarios (min/expected/target/stretch) for a deal and
 * returns the contribution breakdown for each. Handy for partner quoting
 * UI: "tu margen pasa de $X a $Y si subes de 10 a 15 PAX".
 */
export function analizarEscenariosPax(
  deal: Deal,
  licensingMode: LicensingMode = DEFAULT_LICENSING_MODE,
): Array<{ label: string; pax: number; contribution: DealContribution }> {
  const scenarios: Array<{ label: string; pax: number }> = [
    { label: 'Mínimo', pax: deal.pax_min },
    { label: 'Esperado', pax: deal.pax_expected },
    { label: 'Objetivo', pax: deal.pax_target },
    { label: 'Stretch', pax: deal.pax_stretch },
  ];
  return scenarios.map(({ label, pax }) => ({
    label,
    pax,
    contribution: calcularContribucion(
      { ...deal, pax_actual: pax },
      licensingMode,
    ),
  }));
}
