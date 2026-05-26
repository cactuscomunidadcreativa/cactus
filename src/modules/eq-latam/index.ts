/**
 * EQ LATAM MASTER COST - Pricing Intelligence System
 * Module Public API
 *
 * Regional pricing system for EQ Latam (Six Seconds)
 * Certification pricing, event viability, partner proposals & market intelligence.
 */

// Types
export * from './types';
export * from './types/organization';

// Data
export {
  CERT_NAMES,
  ALL_CERT_IDS,
  PACK_DEFINITIONS,
  ON_DEMAND_COSTS,
  GROUP_ONLINE_COSTS,
  GROUP_ONLINE_PACKS,
  IN_PERSON_MT_CERTS,
  IN_PERSON_MT_PACKS,
  IN_PERSON_RF_CERTS,
  IN_PERSON_RF_PACKS,
  PRICING_RULES,
  DISTRIBUTION_STRUCTURE,
  LICENSING_MODE_2026,
  LICENSING_MODE_STRESS_TEST,
  DEFAULT_LICENSING_MODE,
  EQ_WEEK_COST_MODEL,
  FULL_EQ_WEEK_PARTNER_WHOLESALE_PRICES,
  FULL_EQ_WEEK_RETAIL_PRICE_PER_PAX_USD,
  ANNUAL_BUDGET,
  EQ_WEEK_CONFIG,
  MARKET_PRICES,
  MASTER_PRICE_LIST,
  MODALITY_LABELS,
  PAX_OPTIONS_BY_MODALITY,
} from './lib/eq-data';

// Organization (users, areas, permissions, partners, referrers)
export {
  USERS,
  BUSINESS_AREAS,
  AREA_PERMISSIONS,
  PARTNERS,
  PARTNER_CONTACTS,
  REFERRERS,
  buildVisibilityContext,
  getAreaById,
  getUserById,
  getPartnerById,
  getReferrerById,
  getPartnerContacts,
} from './lib/eq-organization';
export {
  canUserSeeArea,
  userLevelInArea,
  PARTNER_TIERS,
  PARTNER_VOLUME_BONUS_CAP_PCT,
  PARTNER_COMBINED_DISCOUNT_CAP_PCT,
  volumeBonusForPax,
  getTierConfig,
  suggestTierForYtdPax,
} from './types/organization';

// Cost catalog (hours × rates by modality)
export {
  HOURLY_RATE_GROUP_DEFAULT_USD,
  CERT_HOURS_CATALOG,
  PACK_HOURS_CATALOG,
  getCertHours,
  getPackHours,
  calcCertFacilitationCost,
  bundleIncludesMerch,
} from './lib/eq-cost-catalog';

// Assessments catalog (credits per assessment, for Graduate calc)
export {
  ASSESSMENTS,
  CATEGORY_LABELS as ASSESSMENT_CATEGORY_LABELS,
  CATEGORY_ORDER as ASSESSMENT_CATEGORY_ORDER,
  GRADUATE_DEFAULT_MARKUP_MULTIPLIER,
} from './lib/eq-assessments-catalog';
export type { Assessment, AssessmentCategory } from './lib/eq-assessments-catalog';

// Pricing Engine
export {
  // V1 (legacy, used by current dashboard tabs)
  pvpSugerido,
  precioPartner,
  neto6S,
  margenNeto,
  calcularCompDirector,
  calcularPrecioCert,
  calcularPrecioPack,
  analizarEvento,
  simularAnual,
  compararMercado,
  compararMercadoCompleto,
  generarPropuestaPartner,
  getBudgetOverview,
  formatPrice,
  formatPriceUSD,
  formatPercent,
  getViabilityColor,
  getViabilityLabel,
  getPositionLabel,
  getPositionColor,
  getCertName,
  getPackName,
  getModalityName,
  // V2 (2026 cash distribution model — source of truth going forward)
  calcularContribucion,
  analizarEscenariosPax,
  calcDeliveryCost,
  resolveFullEqWeekWholesalePrice,
} from './lib/eq-pricing-engine';

// Chat Prompt
export { EQ_LATAM_INTERPRETER_PROMPT } from './lib/eq-chat-prompt';
