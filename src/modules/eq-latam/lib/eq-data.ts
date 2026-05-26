/**
 * EQ LATAM MASTER COST - Static Data
 * All certification costs, packs, budget, and market data.
 * Source: MASTER_CERT_COSTOS_2026
 */

import type {
  CertificationId,
  PackId,
  OnDemandCost,
  GroupOnlineCost,
  GroupOnlinePackCost,
  InPersonCost,
  PricingRules,
  DistributionStructure,
  AnnualBudget,
  MarketPrice,
  EqWeekConfig,
  EqWeekCostModel,
  LicensingMode,
} from '../types';

// ============================================================
// CERTIFICATION NAMES
// ============================================================

export const CERT_NAMES: Record<
  CertificationId,
  { short: string; full: string; is_lead_magnet: boolean }
> = {
  UEQ:  { short: 'UEQ',  full: 'Unlocking EQ', is_lead_magnet: true }, // reposicionado 2026
  BPC:  { short: 'BPC',  full: 'Brain Profiler Certification', is_lead_magnet: false },
  EQAC: { short: 'EQAC', full: 'EQ Assessor Certification', is_lead_magnet: false },
  EQPC: { short: 'EQPC', full: 'EQ Performance Coach', is_lead_magnet: false },
  EQPM: { short: 'EQPM', full: 'EQ Performance Mastery', is_lead_magnet: false },
};

export const ALL_CERT_IDS: CertificationId[] = ['UEQ', 'BPC', 'EQAC', 'EQPC', 'EQPM'];

// ============================================================
// PACK DEFINITIONS
// ============================================================

export const PACK_DEFINITIONS: Record<PackId, { name: string; certs: CertificationId[] }> = {
  UEQ_BPC:             { name: 'UEQ + BPC', certs: ['UEQ', 'BPC'] },
  UEQ_EQAC:            { name: 'UEQ + EQAC', certs: ['UEQ', 'EQAC'] },
  BPC_EQPM:            { name: 'BPC + EQPM', certs: ['BPC', 'EQPM'] },
  UEQ_BPC_EQAC:        { name: 'UEQ + BPC + EQAC', certs: ['UEQ', 'BPC', 'EQAC'] },
  UEQ_BPC_EQAC_EQPC:   { name: 'UEQ + BPC + EQAC + EQPC', certs: ['UEQ', 'BPC', 'EQAC', 'EQPC'] },
  FULL_5:              { name: 'FULL 5 Certs', certs: ['UEQ', 'BPC', 'EQAC', 'EQPC', 'EQPM'] },
  EQPC_EQPM:           { name: 'EQPC + EQPM', certs: ['EQPC', 'EQPM'] },
};

// ============================================================
// ON DEMAND COSTS (1 student, online 1:1)
// ============================================================

export const ON_DEMAND_COSTS: OnDemandCost[] = [
  { certId: 'UEQ',  costoFijo: 105, costoVariable: 0,   licenciamiento: 31.50,  pvpMinimo: 157.50 },
  { certId: 'BPC',  costoFijo: 175, costoVariable: 100, licenciamiento: 82.50,  pvpMinimo: 412.50 },
  { certId: 'EQAC', costoFijo: 300, costoVariable: 170, licenciamiento: 141.00, pvpMinimo: 705.00 },
  { certId: 'EQPC', costoFijo: 510, costoVariable: 150, licenciamiento: 198.00, pvpMinimo: 990.00 },
  { certId: 'EQPM', costoFijo: 100, costoVariable: 510, licenciamiento: 183.00, pvpMinimo: 915.00 },
];

// ============================================================
// GROUP ONLINE COSTS (price per person by PAX)
// ============================================================

export const GROUP_ONLINE_COSTS: GroupOnlineCost[] = [
  {
    certId: 'UEQ',
    costoFijo: 150,
    costoVariablePorPax: 0,
    preciosPorPax: { 1: 157.50, 3: 102.50, 5: 82.50, 10: 67.50, 15: 62.50, 20: 57.50 },
  },
  {
    certId: 'BPC',
    costoFijo: 425,
    costoVariablePorPax: 100,
    preciosPorPax: { 1: 412.50, 3: 379.20, 5: 322.50, 10: 280.00, 15: 265.80, 20: 255.00 },
  },
  {
    certId: 'EQAC',
    costoFijo: 510,
    costoVariablePorPax: 170,
    preciosPorPax: { 1: 705.00, 3: 575.00, 5: 507.00, 10: 456.00, 15: 439.00, 20: 428.00 },
  },
  {
    certId: 'EQPC',
    costoFijo: 510,
    costoVariablePorPax: 150,
    preciosPorPax: { 1: 990.00, 3: 650.00, 5: 582.00, 10: 531.00, 15: 514.00, 20: 503.00 },
  },
  {
    certId: 'EQPM',
    costoFijo: 170,
    costoVariablePorPax: 510,
    preciosPorPax: { 1: 915.00, 3: 871.70, 5: 849.00, 10: 832.00, 15: 826.30, 20: 820.00 },
  },
];

// ============================================================
// GROUP ONLINE PACKS (price per person by PAX)
// ============================================================

export const GROUP_ONLINE_PACKS: GroupOnlinePackCost[] = [
  {
    packId: 'UEQ_BPC',
    costoFijo: 575,
    costoVariablePorPax: 100,
    preciosPorPax: { 3: 466.50, 5: 389.80, 10: 332.30, 15: 313.10 },
  },
  {
    packId: 'UEQ_EQAC',
    costoFijo: 660,
    costoVariablePorPax: 170,
    preciosPorPax: { 3: 643.00, 5: 555.00, 10: 489.00, 15: 467.00 },
  },
  {
    packId: 'BPC_EQPM',
    costoFijo: 595,
    costoVariablePorPax: 610,
    preciosPorPax: { 3: 1184.50, 5: 1105.10, 10: 1045.60, 15: 1025.80 },
  },
  {
    packId: 'UEQ_BPC_EQAC',
    costoFijo: 1595,
    costoVariablePorPax: 420,
    preciosPorPax: { 3: 1401.90, 5: 1189.20, 10: 1029.70, 15: 976.50 },
  },
  {
    packId: 'UEQ_BPC_EQAC_EQPC',
    costoFijo: 1595,
    costoVariablePorPax: 420,
    preciosPorPax: { 3: 1426.70, 5: 1214.00, 10: 1054.50, 15: 1001.30 },
  },
  {
    packId: 'FULL_5',
    costoFijo: 1765,
    costoVariablePorPax: 930,
    preciosPorPax: { 3: 1915.10, 5: 1679.80, 10: 1503.30, 15: 1444.50 },
  },
];

// ============================================================
// IN-PERSON MT (Master Trainer) — cost per person
// ============================================================

export const IN_PERSON_MT_CERTS: InPersonCost[] = [
  { id: 'UEQ',  costoFijo: 2000,  materialsPorPax: 20,  costoVariablePorPax: 0,   preciosPorPax: { 5: 472.50, 10: 272.50, 15: 205.80 } },
  { id: 'BPC',  costoFijo: 3000,  materialsPorPax: 30,  costoVariablePorPax: 100, preciosPorPax: { 5: 867.50, 10: 567.50, 15: 467.50 } },
  { id: 'EQAC', costoFijo: 2000,  materialsPorPax: 50,  costoVariablePorPax: 170, preciosPorPax: { 5: 855.00, 10: 655.00, 15: 588.30 } },
  { id: 'EQPC', costoFijo: 2000,  materialsPorPax: 80,  costoVariablePorPax: 150, preciosPorPax: { 5: 960.00, 10: 760.00, 15: 693.30 } },
  { id: 'EQPM', costoFijo: 2000,  materialsPorPax: 80,  costoVariablePorPax: 510, preciosPorPax: { 5: 1295.00, 10: 1095.00, 15: 1028.30 } },
];

export const IN_PERSON_MT_PACKS: InPersonCost[] = [
  { id: 'EQPC_EQPM',          costoFijo: 4000,  materialsPorPax: 160, costoVariablePorPax: 660, preciosPorPax: { 5: 2255.00, 10: 1855.00, 15: 1721.70 } },
  { id: 'UEQ_BPC_EQAC',       costoFijo: 9000,  materialsPorPax: 180, costoVariablePorPax: 420, preciosPorPax: { 5: 2850.20, 10: 1950.20, 15: 1650.20 } },
  { id: 'UEQ_BPC_EQAC_EQPC',  costoFijo: 9000,  materialsPorPax: 180, costoVariablePorPax: 420, preciosPorPax: { 5: 2875.00, 10: 1975.00, 15: 1675.00 } },
  { id: 'FULL_5',             costoFijo: 13000, materialsPorPax: 260, costoVariablePorPax: 960, preciosPorPax: { 5: 4330.00, 10: 3150.00, 15: 2730.00 } },
];

// ============================================================
// IN-PERSON RF (Regional Facilitator) — cost per person
// ============================================================

export const IN_PERSON_RF_CERTS: InPersonCost[] = [
  { id: 'UEQ',  costoFijo: 1500,  materialsPorPax: 20,  costoVariablePorPax: 20,  preciosPorPax: { 5: 392.50, 10: 242.50, 15: 192.50 } },
  { id: 'BPC',  costoFijo: 1800,  materialsPorPax: 30,  costoVariablePorPax: 130, preciosPorPax: { 5: 657.50, 10: 477.50, 15: 417.50 } },
  { id: 'EQAC', costoFijo: 2000,  materialsPorPax: 50,  costoVariablePorPax: 220, preciosPorPax: { 5: 905.00, 10: 705.00, 15: 638.30 } },
  { id: 'EQPC', costoFijo: 2000,  materialsPorPax: 80,  costoVariablePorPax: 230, preciosPorPax: { 5: 1040.00, 10: 840.00, 15: 773.30 } },
  { id: 'EQPM', costoFijo: 2000,  materialsPorPax: 80,  costoVariablePorPax: 420, preciosPorPax: { 5: 1205.00, 10: 1005.00, 15: 938.30 } },
];

export const IN_PERSON_RF_PACKS: InPersonCost[] = [
  { id: 'EQPC_EQPM',          costoFijo: 4000,  materialsPorPax: 160, costoVariablePorPax: 650, preciosPorPax: { 5: 2168.80, 10: 1768.80, 15: 1635.50 } },
  { id: 'UEQ_BPC_EQAC',       costoFijo: 5300,  materialsPorPax: 100, costoVariablePorPax: 370, preciosPorPax: { 5: 2077.10, 10: 1547.10, 15: 1370.40 } },
  { id: 'UEQ_BPC_EQAC_EQPC',  costoFijo: 7300,  materialsPorPax: 180, costoVariablePorPax: 600, preciosPorPax: { 5: 2639.50, 10: 1909.50, 15: 1666.20 } },
  { id: 'FULL_5',             costoFijo: 11000, materialsPorPax: 260, costoVariablePorPax: 930, preciosPorPax: { 5: 3786.80, 10: 2686.80, 15: 2320.10 } },
];

// ============================================================
// PRICING RULES
// ============================================================

export const PRICING_RULES: PricingRules = {
  suggestedMarkup: 0.25,
  partnerDiscount: 0.30,
  distributionTotal: 0.50, // legacy, retained for backward compat
  roundingNearest: 5,
};

/**
 * Real cash distribution per deal (2026 model).
 *
 * Eduardo 10% Director, 5% ADS allocation, and 5% Base Salary allocation
 * from the old spec are accounting items already covered by the burn fijo
 * (retainer $1,500/mes + ADS budget $1,250/mes + salaries $4,700/mes).
 * They do NOT leave as cash on each deal.
 *
 * What DOES leave as cash per deal:
 *   - Karla 3% (marketing commission, always when marketing_origin = true)
 *   - Closer 5% default / 7% override (whoever closes the deal)
 *   - Referrer 10% (only when channel = 'referrer')
 *   - 6S Global licensing — see LICENSING_MODE separately
 */
export const DISTRIBUTION_STRUCTURE: DistributionStructure = {
  karlaMarketing: 0.03,
  closerDefault: 0.05,
  closerOverrideMax: 0.07,
  referrerDefault: 0.10,
};

/**
 * Licensing mode for 6S Global payments.
 *
 * 2026 = annual flat $40,000 negotiated; no per-deal 30%.
 * 2027+ default returns to 30% of revenue per deal until renegotiated.
 *
 * This is a config switch — admin can toggle to stress-test what the
 * business looks like under 30% percentage mode.
 */
export const LICENSING_MODE_2026: LicensingMode = {
  type: 'annual_flat',
  amount_usd: 40_000,
  year: 2026,
};

export const LICENSING_MODE_STRESS_TEST: LicensingMode = {
  type: 'percentage_of_revenue',
  rate: 0.30,
};

/** Default mode used by the platform until toggled by admin. */
export const DEFAULT_LICENSING_MODE: LicensingMode = LICENSING_MODE_2026;

// ============================================================
// EQ WEEK COST MODEL (new, replaces in-person pack costs)
// ============================================================

/**
 * Source: Master Cert Costos + Eduardo's operational restructure 2026.
 * Replaces the prior inflated cost tables in IN_PERSON_*_PACKS.
 */
export const EQ_WEEK_COST_MODEL: EqWeekCostModel = {
  facilitation_days: 5,
  facilitation_per_day_usd: 1000,
  materials_kit_per_pax_usd: 35,
  merch_per_pax_usd: 90,                    // costo real
  merch_retail_value_per_pax_usd: 150,      // valor de cotización (hidden margin $60/PAX)
  default_travel_usd: 2500,
};

/**
 * Partner wholesale pricing for FULL EQ WEEK (Talent Advisors confirmed).
 * Sliding scale by PAX — more PAX = lower per-PAX price.
 * Source: "Numeros EQ WEEK Partner TA.pdf"
 */
export const FULL_EQ_WEEK_PARTNER_WHOLESALE_PRICES: Record<number, number> = {
  3:  4989.27,
  5:  3370.51,
  10: 2156.44,
  15: 1751.75,  // TARGET
  20: 1549.41,
};

/**
 * Retail price suggested to the END CLIENT (whether via partner, direct, or referrer).
 * Source: Eduardo confirmation — "el partner vende a 2500".
 */
export const FULL_EQ_WEEK_RETAIL_PRICE_PER_PAX_USD = 2500;

// ============================================================
// ANNUAL BUDGET
// ============================================================

/**
 * ANNUAL BUDGET 2026 — post-restructure.
 *
 * Burn fijo mensual real: $10,983 (vs. $19,613 anterior).
 *
 * Eliminados:
 *   - Health Insurance (último mes ya pasado)
 *   - Training (ya no se hace)
 *   - Products COGS (ya no hay productos físicos en catálogo fijo)
 *
 * Movidos a variable (cargados por evento, no fijo mensual):
 *   - Travel ($667/mes → variable por destino)
 *   - Shipping ($250/mes → variable por evento si hay envío)
 *   - Supplies & Print ($375/mes → variable por evento)
 *
 * Eduardo retainer $1,500/mes (10% sobre ventas es contable, ya cubre el retainer).
 * Karla subió a $1,100/mes al asumir Marketing (cubre función Comercial vacante).
 */
export const ANNUAL_BUDGET: AnnualBudget = {
  totalAnnualCosts: 131_796, // burn fijo anual real
  fixedCosts: [
    { label: 'Director (Eduardo) retainer', amount: 18000, category: 'team' },
    { label: 'Natalia Vergara', amount: 7200, category: 'team' },
    { label: 'Liliana Rodriguez', amount: 7200, category: 'team' },
    { label: 'Otilia Esquivia', amount: 3600, category: 'team' },
    { label: 'Karla Parra (Marketing)', amount: 13200, category: 'team' }, // $1,100 × 12
    { label: 'Andreia Delpra', amount: 7200, category: 'team' },
    { label: 'Marketing & Ads', amount: 15000, category: 'marketing' },
    { label: 'IT & Technology', amount: 5000, category: 'operations' },
    { label: 'Internet/Comms', amount: 2400, category: 'operations' },
    { label: 'Bank/PayPal Fees', amount: 1600, category: 'operations' },
    { label: 'Rent/Business Office', amount: 9000, category: 'operations' },
    { label: 'Shared Expenses (6S Global)', amount: 40000, category: 'shared' }, // flat negotiated 2026
  ],
  variableCosts: 0, // cargados por evento en cada Deal
  nonCertIncome: [
    { category: 'consulting',  label: 'Services/Consulting (EQ Biz)',  amount: 103200, description: 'Andreia — consultoría corporativa y facilitación' },
    { category: 'assessments', label: 'Assessments (créditos)',         amount: 146000, description: 'TARGET 2026 — créditos cubren el burn fijo' },
    { category: 'membership',  label: 'Membership Fee Income',          amount: 31300,  description: 'Eduardo only' },
    { category: 'products',    label: 'Products (merch + materials)',   amount: 13400,  description: 'Margen merch + materiales sueltos' },
    { category: 'brazil',      label: 'Subsidiary Brazil',              amount: 1860,   description: 'Brazil operations income' },
    { category: 'donations',   label: 'Donations',                      amount: 3000,   description: 'Grants and donations' },
    { category: 'impact',      label: 'EQ Impact Programs',             amount: 14900,  description: 'Liliana + Otilia' },
  ],
  totalNonCertIncome: 313660,
  certMustCoverNet: 0, // ya no aplica con el modelo nuevo — créditos cubren burn
};

// ============================================================
// EQ WEEK CONFIG
// ============================================================

export const EQ_WEEK_CONFIG: EqWeekConfig = {
  eventsPerYear: 3,
  targetPaxPerEvent: 10,
  hotelFoodPartnerPaysPerPax: 185,
  travelCostPerEvent: 1500,
};

// ============================================================
// MARKET PRICES - 6S GLOBAL
// ============================================================

export const MARKET_PRICES: MarketPrice[] = [
  { certId: 'UEQ',  globalOnline: 245,   globalPresencial: '$300-400',   position: 'Muy competitivo' },
  { certId: 'BPC',  globalOnline: 595,   globalPresencial: '$700-900',   position: 'Competitivo' },
  { certId: 'EQAC', globalOnline: 1495,  globalPresencial: '$2,000+',    position: 'Muy accesible' },
  { certId: 'EQPC', globalOnline: 2495,  globalPresencial: '$3,390',     position: 'Muy accesible' },
  { certId: 'EQPM', globalOnline: 2495,  globalPresencial: '$2,800+',    position: 'Muy accesible' },
];

export const GLOBAL_FULL_ONLINE_PRICE = 8020;
export const GLOBAL_FULL_PRESENCIAL_PRICE = 10000;

// ============================================================
// MASTER PRICE LIST (On Demand - Quick Reference)
// ============================================================

export const MASTER_PRICE_LIST: Record<CertificationId | 'FULL', {
  costoReal: number;
  pvpMinimo: number;
  pvpSugerido: number;
  global6S: number;
  precioPartner: number;
}> = {
  UEQ:  { costoReal: 136.50,  pvpMinimo: 157.50,  pvpSugerido: 200,   global6S: 245,   precioPartner: 110 },
  BPC:  { costoReal: 357.50,  pvpMinimo: 412.50,  pvpSugerido: 515,   global6S: 595,   precioPartner: 290 },
  EQAC: { costoReal: 611.00,  pvpMinimo: 705.00,  pvpSugerido: 880,   global6S: 1495,  precioPartner: 495 },
  EQPC: { costoReal: 858.00,  pvpMinimo: 990.00,  pvpSugerido: 1240,  global6S: 2495,  precioPartner: 695 },
  EQPM: { costoReal: 793.00,  pvpMinimo: 915.00,  pvpSugerido: 1145,  global6S: 2495,  precioPartner: 640 },
  FULL: { costoReal: 2155.50, pvpMinimo: 2517.00, pvpSugerido: 3145,  global6S: 8020,  precioPartner: 1760 },
};

// ============================================================
// MODALITY LABELS
// ============================================================

export const MODALITY_LABELS: Record<string, string> = {
  on_demand: 'On Demand (1:1 Online)',
  group_online: 'Grupal Online',
  in_person_mt: 'Presencial MT (Master Trainer)',
  in_person_rf: 'Presencial RF (Regional Facilitator)',
};

export const PAX_OPTIONS_BY_MODALITY: Record<string, number[]> = {
  on_demand: [1],
  group_online: [1, 3, 5, 10, 15, 20],
  in_person_mt: [5, 10, 15],
  in_person_rf: [5, 10, 15],
};
