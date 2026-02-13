/**
 * CEREUS x PRIVAT - Emotional Algorithmic Atelier
 * Module Public API
 *
 * The first emotional algorithmic atelier in Latin America.
 * Built as a sub-app within Cactus Comunidad Creativa.
 */

// Types
export * from './types';

// Costing Engine
export {
  calculateBOMCost,
  calculateCostBreakdown,
  calculatePrice,
  calculateMargin,
  classifyMargin,
  calculatePricing,
  calculatePricingAtPrice,
  calculateVariantPricing,
  analyzeMarginDeviation,
  formatPrice,
  formatPercent,
  getMarginEmoji,
  CEREUS_MARGIN_RANGES,
  DEFAULT_OVERHEAD_PERCENT,
  DEFAULT_WASTE_FACTOR,
  COMPLEXITY_MULTIPLIERS,
} from './lib/costing-engine';

// Emotional Intelligence
export {
  EMOTIONAL_QUESTIONNAIRE,
  calculateArchetypeScores,
  getTopArchetypes,
  determineEmotionalSeason,
  determineWarmth,
} from './lib/emotional-questionnaire';

// AI Prompts
export {
  PHOTO_ANALYSIS_SYSTEM,
  PHOTO_ANALYSIS_USER,
  STYLE_PROFILE_SYSTEM,
  STYLE_PROFILE_USER,
  ADVISOR_SYSTEM,
  ADVISOR_RECOMMENDATION,
  CLOSET_ANALYSIS_SYSTEM,
  CLOSET_ANALYSIS_USER,
  COLLECTION_BRIEF_SYSTEM,
  COLLECTION_BRIEF_USER,
  RAMONA_FASHION_CAMPAIGN_SYSTEM,
  RAMONA_FASHION_CAMPAIGN_USER,
} from './lib/ai-prompts';
