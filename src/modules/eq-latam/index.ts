/**
 * EQ LATAM MASTER COST - Pricing Intelligence System
 * Module Public API
 *
 * Regional pricing system for EQ Latam (Six Seconds)
 * Certification pricing, event viability, partner proposals & market intelligence.
 */

// Types
export * from './types';

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
  ANNUAL_BUDGET,
  EQ_WEEK_CONFIG,
  MARKET_PRICES,
  MASTER_PRICE_LIST,
  MODALITY_LABELS,
  PAX_OPTIONS_BY_MODALITY,
} from './lib/eq-data';

// Pricing Engine
export {
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
} from './lib/eq-pricing-engine';

// Chat Prompt
export { EQ_LATAM_INTERPRETER_PROMPT } from './lib/eq-chat-prompt';
