/**
 * EQ LATAM MASTER COST - Type Definitions
 * Pricing Intelligence System for EQ Latam (Six Seconds)
 */

// ============================================================
// ENUMS & LITERALS
// ============================================================

export type CertificationId = 'UEQ' | 'BPC' | 'EQAC' | 'EQPC' | 'EQPM';

export type Modality =
  | 'on_demand'
  | 'group_online'
  | 'in_person_mt'
  | 'in_person_rf';

export type TrainerRole = 'MT' | 'RF';

export type PackId =
  | 'UEQ_BPC'
  | 'UEQ_EQAC'
  | 'BPC_EQPM'
  | 'UEQ_BPC_EQAC'
  | 'UEQ_BPC_EQAC_EQPC'
  | 'FULL_5'
  | 'EQPC_EQPM';

export type ViabilityLevel = 'GO' | 'MARGINAL' | 'NO_GO';

export type ServiceCategory =
  | 'consulting'
  | 'assessments'
  | 'membership'
  | 'products'
  | 'brazil'
  | 'donations'
  | 'impact';

export type DashboardTab =
  | 'calculator'
  | 'event_analyzer'
  | 'partner_proposal'
  | 'annual_simulator'
  | 'market_comparison'
  | 'services';

export type ChatIntentType =
  | 'precio'
  | 'evento'
  | 'partner'
  | 'simulacion'
  | 'comparar'
  | 'gap'
  | 'comp_director'
  | 'servicios'
  | 'conversacion';

// ============================================================
// CERTIFICATION DATA
// ============================================================

export interface OnDemandCost {
  certId: CertificationId;
  costoFijo: number;
  costoVariable: number;
  licenciamiento: number;
  pvpMinimo: number;
}

export interface GroupOnlineCost {
  certId: CertificationId;
  costoFijo: number;
  costoVariablePorPax: number;
  preciosPorPax: Record<number, number>; // pax -> cost per pax
}

export interface GroupOnlinePackCost {
  packId: PackId;
  costoFijo: number;
  costoVariablePorPax: number;
  preciosPorPax: Record<number, number>;
}

export interface InPersonCost {
  id: CertificationId | PackId;
  costoFijo: number;
  materialsPorPax: number;
  costoVariablePorPax: number;
  preciosPorPax: Record<number, number>;
}

// ============================================================
// PRICING RULES & DISTRIBUTION
// ============================================================

export interface PricingRules {
  suggestedMarkup: number;      // 0.25 = +25%
  partnerDiscount: number;      // 0.30 = -30%
  distributionTotal: number;    // legacy, kept for backward compat
  roundingNearest: number;      // 5 = round to $5
}

/**
 * Real cash leaving 6S Latam on each deal.
 *
 * Eduardo (10%), ADS (5%), and Base Salary (5%) from the original spec
 * are NOT cash distribution — they are accounting allocations already
 * covered by the fixed monthly burn (retainer + ADS budget + salaries).
 *
 * Licensing 6S Global is handled separately via LicensingMode.
 */
export interface DistributionStructure {
  /** Karla Marketing commission, applies on every deal that has marketing origin. */
  karlaMarketing: number;       // 0.03
  /** Closer commission default. Override per-deal up to 0.07. */
  closerDefault: number;        // 0.05
  closerOverrideMax: number;    // 0.07
  /** Referrer commission default (external referrer like Yisseth). */
  referrerDefault: number;      // 0.10
}

/**
 * How 6S Global gets paid. Switchable per year.
 *
 *  - annual_flat: a fixed yearly fee, no per-deal cost (2026 negotiated).
 *  - percentage_of_revenue: per-deal cash out (likely 2027+ default).
 */
export type LicensingMode =
  | { type: 'annual_flat'; amount_usd: number; year: number }
  | { type: 'percentage_of_revenue'; rate: number };

// ============================================================
// EQ WEEK COST MODEL (new — simplified per actual operations)
// ============================================================

/**
 * Real cost structure for a Full EQ Week event.
 * - Facilitación flat (5 días × $1,000 por defecto)
 * - Materials kit per PAX
 * - Merch per PAX (only when bundle includes EQPC + EQPM)
 * - Credits cost is $0 (covered by annual maintenance to 6S Global)
 * - Travel configurable per destination
 */
export interface EqWeekCostModel {
  facilitation_days: number;          // 5
  facilitation_per_day_usd: number;   // 1000
  materials_kit_per_pax_usd: number;  // 35
  merch_per_pax_usd: number;          // 90 (only if Full EQ Week)
  merch_retail_value_per_pax_usd: number; // 150 (hidden margin marker)
  default_travel_usd: number;         // 2500
}

// ============================================================
// DEAL — the central transactional entity
// ============================================================

export type DealStatus =
  | 'quoted'
  | 'closed'
  | 'delivered'
  | 'cancelled'
  | 'relationship_event';

export type SalesChannel = 'direct' | 'partner' | 'referrer';

export interface Deal {
  id: string;
  area_id: string;                    // BusinessArea id
  product_code: string;               // 'FULL_EQ_WEEK' | cert code | bundle code
  modality: Modality;
  trainerRole?: TrainerRole;

  /** Identity / logistics */
  city?: string;                      // 'Cartagena'
  country: 'PE' | 'CO' | 'MX' | 'OTHER';
  event_date?: string;                // ISO

  /** Volume */
  pax_min: number;                    // 5 default
  pax_expected: number;               // closes here
  pax_target: number;                 // 15 default
  pax_stretch: number;                // 20 default
  pax_actual?: number;                // when closed/delivered

  /** Attribution — exactly one channel */
  channel: SalesChannel;
  partner_id?: string;                // when channel='partner'
  referrer_id?: string;               // when channel='referrer'

  /** Internal closer */
  closer_user_id: string;
  closer_commission_pct: number;      // 0.05 or 0.07
  marketing_origin: boolean;          // triggers Karla 3%

  /** Override referrer commission (else use referrer's default) */
  referrer_commission_pct_override?: number;

  /** Pricing */
  retail_price_per_pax_usd: number;   // what end client pays
  wholesale_price_per_pax_usd?: number; // what partner pays 6S Latam (if partner channel)

  /** Cost overrides per deal */
  travel_usd?: number;                // override default

  status: DealStatus;
  notes?: string;
}

/**
 * Per-deal contribution breakdown. Result of the pricing engine.
 */
export interface DealContribution {
  deal_id: string;
  pax: number;

  revenue_usd: number;

  // Cash out (real)
  karla_marketing_usd: number;
  closer_usd: number;
  referrer_usd: number;
  licensing_global_usd: number;       // 0 if annual_flat mode, else 30% revenue

  total_cash_distribution_usd: number;

  // Delivery cost
  facilitation_usd: number;
  materials_kit_usd: number;
  merch_usd: number;
  merch_hidden_margin_usd: number;    // $60/PAX × pax if Full EQ Week
  travel_usd: number;
  credits_cost_usd: number;
  total_delivery_cost_usd: number;

  // Final
  contribution_usd: number;
  margin_pct: number;
}

// ============================================================
// BUDGET & SERVICES
// ============================================================

export interface FixedCostItem {
  label: string;
  amount: number;
  category: 'team' | 'operations' | 'marketing' | 'shared';
}

export interface ServiceIncomeItem {
  category: ServiceCategory;
  label: string;
  amount: number;
  description: string;
}

export interface AnnualBudget {
  totalAnnualCosts: number;
  fixedCosts: FixedCostItem[];
  variableCosts: number;
  nonCertIncome: ServiceIncomeItem[];
  totalNonCertIncome: number;
  certMustCoverNet: number;
}

// ============================================================
// MARKET DATA
// ============================================================

export interface MarketPrice {
  certId: CertificationId;
  globalOnline: number;
  globalPresencial: string; // range like "$300-400"
  position: string;
}

// ============================================================
// CALCULATION RESULTS
// ============================================================

export interface PricingResult {
  certId: CertificationId;
  modality: Modality;
  trainerRole?: TrainerRole;
  pax: number;

  // Cost breakdown
  costoReal: number;
  pvpMinimo: number;
  pvpSugerido: number;
  precioPartner: number;
  precio6SGlobal: number;

  // Margins
  margenSugerido: number;
  margenPartner: number;

  // Netos
  neto6S: number;
  totalRevenueSugerido: number;
  totalRevenuePartner: number;

  // Comparison
  descuentoVsGlobal: number; // % below 6S Global

  // Viability
  viable: boolean;
  deficit?: number;
}

export interface PackPricingResult {
  packId: PackId;
  certIds: CertificationId[];
  modality: Modality;
  trainerRole?: TrainerRole;
  pax: number;

  // Aggregated costs
  costoFijoTotal: number;
  costoMaterialesTotal: number;
  costoVariableTotal: number;
  costoEntregaTotal: number;
  costoPorPax: number;

  // Prices
  pvpMinimoPorPax: number;
  pvpSugeridoPorPax: number;
  precioPartnerPorPax: number;

  // Totals
  totalCosto: number;
  totalSugerido: number;
  totalPartner: number;

  // Margins & viability
  margenSugerido: number;
  neto6S: number;
  margenNeto: number;
  viability: ViabilityLevel;
  viabilityReason: string;
}

export interface EventAnalysis {
  packId: PackId;
  modality: Modality;
  trainerRole: TrainerRole;
  pax: number;
  isEqWeek: boolean;

  // Cost breakdown
  costoFijo: number;
  costoMateriales: number;
  costoVariable: number;
  costoEntrega: number;

  // Revenue
  ingresoSugerido: number;
  ingresoPartner: number;

  // Net
  neto6SSugerido: number;
  margenNetoEvento: number;

  // Viability
  viability: ViabilityLevel;
  viabilityReason: string;

  // Break-even
  precioMinimoAutosustentable: number;
  paxMinimoParaViabilidad: number;
}

export interface AnnualSimulation {
  events: EventPlan[];
  totalCertRevenue: number;
  totalCertCosts: number;
  totalCertProfit: number;
  budgetGap: number;           // $16,500
  gapCovered: number;          // how much of gap is covered
  gapRemaining: number;
  coveragePercent: number;
  directorComp: number;        // $18k + 10%
  isSustainable: boolean;
  recommendation: string;
}

export interface EventPlan {
  id: string;
  name: string;
  packId: PackId;
  modality: Modality;
  trainerRole: TrainerRole;
  pax: number;
  isEqWeek: boolean;
  month: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface MarketComparison {
  certId: CertificationId;
  eqLatamSugerido: number;
  global6SOnline: number;
  diferencia: number;
  diferenciaPct: number;
  posicion: 'muy_competitivo' | 'competitivo' | 'accesible' | 'muy_accesible';
}

export interface PartnerProposal {
  partnerName: string;
  date: string;
  items: PartnerProposalItem[];
  totalInversion: number;
  totalAhorro: number;
  ahorroPct: number;
  validezDias: number;
}

export interface PartnerProposalItem {
  packId: PackId;
  packName: string;
  modality: Modality;
  trainerRole?: TrainerRole;
  pax: number;
  precioPartnerPorPax: number;
  totalPartner: number;
  precioPublicoPorPax: number;
  totalPublico: number;
  ahorro: number;
}

// ============================================================
// CHAT
// ============================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  data?: {
    tipo: ChatIntentType;
    payload?: PricingResult | PackPricingResult | EventAnalysis | MarketComparison[] | AnnualSimulation;
  };
}

export interface ChatParsedIntent {
  tipo: ChatIntentType;
  datos: {
    certId?: CertificationId;
    packId?: PackId;
    modality?: Modality;
    trainerRole?: TrainerRole;
    pax?: number;
    partnerName?: string;
    ingresosBrutos?: number;
  };
  mensaje?: string;
}

// ============================================================
// EQ WEEK CONFIG
// ============================================================

export interface EqWeekConfig {
  eventsPerYear: number;
  targetPaxPerEvent: number;
  hotelFoodPartnerPaysPerPax: number;
  travelCostPerEvent: number;
}
