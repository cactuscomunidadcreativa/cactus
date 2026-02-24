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
  distributionTotal: number;    // 0.50 = 50%
  roundingNearest: number;      // 5 = round to $5
}

export interface DistributionStructure {
  licensing6S: number;          // 0.30
  adsFund: number;              // 0.05
  baseSalary: number;           // 0.05
  commercialCommission: number; // 0.10
  directorHybrid: number;       // 0.10
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
