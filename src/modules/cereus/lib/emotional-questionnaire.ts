/**
 * CEREUS Emotional Intelligence - Questionnaire Engine
 * Defines the emotional questionnaire structure, scoring logic,
 * and archetype mapping for the Style Intelligence layer.
 */

import type { StyleArchetype, QuestionnaireResponses, Warmth } from '../types';

// ============================================================
// QUESTIONNAIRE STRUCTURE
// ============================================================

export interface QuestionOption {
  value: string;
  label: string;
  labelEs: string;
  emoji?: string;
  archetype_weights?: Partial<Record<StyleArchetype, number>>;
}

export interface Question {
  id: string;
  type: 'multi_select' | 'single_select' | 'slider' | 'free_text' | 'ranking';
  label: string;
  labelEs: string;
  description?: string;
  descriptionEs?: string;
  options?: QuestionOption[];
  min_select?: number;
  max_select?: number;
  slider_min?: number;
  slider_max?: number;
  slider_labels?: [string, string]; // [left label, right label]
  required: boolean;
}

export const EMOTIONAL_QUESTIONNAIRE: Question[] = [
  {
    id: 'color_preferences',
    type: 'multi_select',
    label: 'Which colors make you feel most powerful?',
    labelEs: '¿Qué colores te hacen sentir más poderosa?',
    description: 'Select 3-5 colors',
    descriptionEs: 'Selecciona 3-5 colores',
    min_select: 3,
    max_select: 5,
    required: true,
    options: [
      { value: 'noir', label: 'Noir', labelEs: 'Negro', emoji: '🖤',
        archetype_weights: { power_executive: 0.3, modern_minimalist: 0.2, structured_architectural: 0.2 } },
      { value: 'ivory', label: 'Ivory', labelEs: 'Marfil', emoji: '🤍',
        archetype_weights: { classic_elegance: 0.3, ethereal_goddess: 0.2, romantic_dreamer: 0.2 } },
      { value: 'burgundy', label: 'Burgundy', labelEs: 'Borgoña', emoji: '🍷',
        archetype_weights: { classic_elegance: 0.2, power_executive: 0.2, bold_avant_garde: 0.1 } },
      { value: 'navy', label: 'Navy', labelEs: 'Azul Marino', emoji: '🌊',
        archetype_weights: { classic_elegance: 0.3, power_executive: 0.3 } },
      { value: 'emerald', label: 'Emerald', labelEs: 'Esmeralda', emoji: '💚',
        archetype_weights: { classic_elegance: 0.2, bold_avant_garde: 0.2, ethereal_goddess: 0.1 } },
      { value: 'blush', label: 'Blush', labelEs: 'Rosa Palo', emoji: '🌸',
        archetype_weights: { romantic_dreamer: 0.4, ethereal_goddess: 0.2 } },
      { value: 'gold', label: 'Gold', labelEs: 'Dorado', emoji: '✨',
        archetype_weights: { bold_avant_garde: 0.3, power_executive: 0.2 } },
      { value: 'silver', label: 'Silver', labelEs: 'Plateado', emoji: '🪩',
        archetype_weights: { modern_minimalist: 0.3, structured_architectural: 0.2 } },
      { value: 'crimson', label: 'Crimson', labelEs: 'Carmesí', emoji: '❤️',
        archetype_weights: { bold_avant_garde: 0.3, power_executive: 0.2 } },
      { value: 'white', label: 'White', labelEs: 'Blanco', emoji: '⬜',
        archetype_weights: { modern_minimalist: 0.3, ethereal_goddess: 0.2, classic_elegance: 0.1 } },
      { value: 'earth_tones', label: 'Earth Tones', labelEs: 'Tonos Tierra', emoji: '🌿',
        archetype_weights: { bohemian_free: 0.4, classic_elegance: 0.1 } },
      { value: 'jewel_tones', label: 'Jewel Tones', labelEs: 'Tonos Joya', emoji: '💎',
        archetype_weights: { bold_avant_garde: 0.2, classic_elegance: 0.2, romantic_dreamer: 0.1 } },
    ],
  },
  {
    id: 'texture_preferences',
    type: 'multi_select',
    label: 'Which textures call to you?',
    labelEs: '¿Qué texturas te atraen?',
    description: 'Select 2-3 textures',
    descriptionEs: 'Selecciona 2-3 texturas',
    min_select: 2,
    max_select: 3,
    required: true,
    options: [
      { value: 'silk', label: 'Silk', labelEs: 'Seda', emoji: '🪶',
        archetype_weights: { classic_elegance: 0.3, romantic_dreamer: 0.2, ethereal_goddess: 0.2 } },
      { value: 'velvet', label: 'Velvet', labelEs: 'Terciopelo', emoji: '🟣',
        archetype_weights: { romantic_dreamer: 0.3, bold_avant_garde: 0.2, classic_elegance: 0.1 } },
      { value: 'cashmere', label: 'Cashmere', labelEs: 'Cachemira', emoji: '☁️',
        archetype_weights: { classic_elegance: 0.3, modern_minimalist: 0.2 } },
      { value: 'leather', label: 'Leather', labelEs: 'Cuero', emoji: '🖤',
        archetype_weights: { bold_avant_garde: 0.3, power_executive: 0.2, structured_architectural: 0.1 } },
      { value: 'lace', label: 'Lace', labelEs: 'Encaje', emoji: '🕊️',
        archetype_weights: { romantic_dreamer: 0.4, ethereal_goddess: 0.2 } },
      { value: 'organza', label: 'Organza', labelEs: 'Organza', emoji: '🦋',
        archetype_weights: { ethereal_goddess: 0.4, romantic_dreamer: 0.2 } },
      { value: 'tweed', label: 'Tweed', labelEs: 'Tweed', emoji: '🧶',
        archetype_weights: { classic_elegance: 0.4, structured_architectural: 0.1 } },
      { value: 'linen', label: 'Linen', labelEs: 'Lino', emoji: '🌾',
        archetype_weights: { bohemian_free: 0.3, modern_minimalist: 0.2 } },
      { value: 'satin', label: 'Satin', labelEs: 'Satín', emoji: '💜',
        archetype_weights: { classic_elegance: 0.2, power_executive: 0.2, romantic_dreamer: 0.1 } },
      { value: 'structured_wool', label: 'Structured Wool', labelEs: 'Lana Estructurada', emoji: '🧥',
        archetype_weights: { structured_architectural: 0.3, power_executive: 0.2, classic_elegance: 0.1 } },
    ],
  },
  {
    id: 'fashion_icons',
    type: 'free_text',
    label: 'Name 2-3 style icons you admire',
    labelEs: 'Nombra 2-3 íconos de estilo que admires',
    description: 'Anyone whose style inspires you',
    descriptionEs: 'Cualquier persona cuyo estilo te inspire',
    required: false,
  },
  {
    id: 'occasions_priority',
    type: 'ranking',
    label: 'Rank these occasions by importance in your life',
    labelEs: 'Ordena estas ocasiones por importancia en tu vida',
    required: true,
    options: [
      { value: 'gala', label: 'Gala / Red Carpet', labelEs: 'Gala / Alfombra Roja',
        archetype_weights: { bold_avant_garde: 0.2, classic_elegance: 0.2 } },
      { value: 'business', label: 'Business / Corporate', labelEs: 'Negocios / Corporativo',
        archetype_weights: { power_executive: 0.4, structured_architectural: 0.1 } },
      { value: 'cocktail', label: 'Cocktail / Evening', labelEs: 'Cóctel / Noche',
        archetype_weights: { classic_elegance: 0.2, romantic_dreamer: 0.1 } },
      { value: 'casual_elevated', label: 'Casual Elevated', labelEs: 'Casual Elevado',
        archetype_weights: { modern_minimalist: 0.3, bohemian_free: 0.2 } },
      { value: 'bridal', label: 'Bridal / Special', labelEs: 'Nupcial / Especial',
        archetype_weights: { romantic_dreamer: 0.3, ethereal_goddess: 0.2 } },
      { value: 'travel', label: 'Travel', labelEs: 'Viaje',
        archetype_weights: { bohemian_free: 0.3, modern_minimalist: 0.2 } },
    ],
  },
  {
    id: 'comfort_vs_impact',
    type: 'slider',
    label: 'Comfort vs Impact',
    labelEs: 'Comodidad vs Impacto',
    slider_min: 1,
    slider_max: 10,
    slider_labels: ['Comfortable', 'Head-turning'],
    required: true,
  },
  {
    id: 'minimalism_vs_maximalism',
    type: 'slider',
    label: 'Minimalism vs Maximalism',
    labelEs: 'Minimalismo vs Maximalismo',
    slider_min: 1,
    slider_max: 10,
    slider_labels: ['Less is more', 'More is more'],
    required: true,
  },
  {
    id: 'classic_vs_trendy',
    type: 'slider',
    label: 'Classic vs Avant-garde',
    labelEs: 'Clásico vs Vanguardia',
    slider_min: 1,
    slider_max: 10,
    slider_labels: ['Timeless', 'Cutting edge'],
    required: true,
  },
  {
    id: 'structured_vs_flowing',
    type: 'slider',
    label: 'Structured vs Flowing',
    labelEs: 'Estructurado vs Fluido',
    slider_min: 1,
    slider_max: 10,
    slider_labels: ['Architectural', 'Ethereal'],
    required: true,
  },
  {
    id: 'mood_dressing',
    type: 'single_select',
    label: 'I dress to feel...',
    labelEs: 'Me visto para sentirme...',
    required: true,
    options: [
      { value: 'empowered', label: 'Empowered', labelEs: 'Empoderada', emoji: '💪',
        archetype_weights: { power_executive: 0.4, structured_architectural: 0.2 } },
      { value: 'elegant', label: 'Elegant', labelEs: 'Elegante', emoji: '👑',
        archetype_weights: { classic_elegance: 0.5 } },
      { value: 'mysterious', label: 'Mysterious', labelEs: 'Misteriosa', emoji: '🌙',
        archetype_weights: { bold_avant_garde: 0.3, structured_architectural: 0.2 } },
      { value: 'joyful', label: 'Joyful', labelEs: 'Alegre', emoji: '✨',
        archetype_weights: { bohemian_free: 0.3, romantic_dreamer: 0.2 } },
      { value: 'confident', label: 'Confident', labelEs: 'Segura', emoji: '🔥',
        archetype_weights: { power_executive: 0.3, modern_minimalist: 0.2 } },
      { value: 'sensual', label: 'Sensual', labelEs: 'Sensual', emoji: '🌹',
        archetype_weights: { romantic_dreamer: 0.2, bold_avant_garde: 0.2, classic_elegance: 0.1 } },
      { value: 'free', label: 'Free', labelEs: 'Libre', emoji: '🦋',
        archetype_weights: { bohemian_free: 0.4, ethereal_goddess: 0.2 } },
      { value: 'protected', label: 'Protected', labelEs: 'Protegida', emoji: '🛡️',
        archetype_weights: { structured_architectural: 0.3, modern_minimalist: 0.2 } },
    ],
  },
  {
    id: 'personal_manifesto',
    type: 'free_text',
    label: 'Complete: "When I get dressed, I want the world to see..."',
    labelEs: 'Completa: "Cuando me visto, quiero que el mundo vea..."',
    required: false,
  },
];

// ============================================================
// SCORING ENGINE
// ============================================================

/**
 * Calculate archetype scores from questionnaire responses
 */
export function calculateArchetypeScores(
  responses: QuestionnaireResponses
): Record<StyleArchetype, number> {
  const scores: Record<string, number> = {
    classic_elegance: 0,
    modern_minimalist: 0,
    romantic_dreamer: 0,
    bold_avant_garde: 0,
    bohemian_free: 0,
    power_executive: 0,
    ethereal_goddess: 0,
    structured_architectural: 0,
  };

  // Process multi-select questions (colors, textures)
  for (const question of EMOTIONAL_QUESTIONNAIRE) {
    if (question.type === 'multi_select' && question.options) {
      const selectedValues = (responses[question.id] as string[]) || [];
      for (const value of selectedValues) {
        const option = question.options.find(o => o.value === value);
        if (option?.archetype_weights) {
          for (const [archetype, weight] of Object.entries(option.archetype_weights)) {
            scores[archetype] = (scores[archetype] || 0) + (weight || 0);
          }
        }
      }
    }

    // Process single-select (mood_dressing)
    if (question.type === 'single_select' && question.options) {
      const selectedValue = responses[question.id] as string;
      const option = question.options?.find(o => o.value === selectedValue);
      if (option?.archetype_weights) {
        for (const [archetype, weight] of Object.entries(option.archetype_weights)) {
          scores[archetype] = (scores[archetype] || 0) + ((weight || 0) * 1.5); // single select has higher weight
        }
      }
    }

    // Process ranking (first items get more weight)
    if (question.type === 'ranking' && question.options) {
      const rankedValues = (responses[question.id] as string[]) || [];
      rankedValues.forEach((value, index) => {
        const weight = 1 - (index * 0.15); // first item = 1.0, second = 0.85, etc.
        const option = question.options?.find(o => o.value === value);
        if (option?.archetype_weights) {
          for (const [archetype, w] of Object.entries(option.archetype_weights)) {
            scores[archetype] = (scores[archetype] || 0) + ((w || 0) * weight);
          }
        }
      });
    }
  }

  // Process sliders
  const comfortImpact = (responses.comfort_vs_impact as number) || 5;
  const minMax = (responses.minimalism_vs_maximalism as number) || 5;
  const classicTrendy = (responses.classic_vs_trendy as number) || 5;
  const structuredFlowing = (responses.structured_vs_flowing as number) || 5;

  // High impact → power_executive, bold_avant_garde
  if (comfortImpact > 7) {
    scores.power_executive += 0.3;
    scores.bold_avant_garde += 0.2;
  } else if (comfortImpact < 4) {
    scores.bohemian_free += 0.3;
    scores.modern_minimalist += 0.2;
  }

  // High maximalism → bold_avant_garde, romantic_dreamer
  if (minMax > 7) {
    scores.bold_avant_garde += 0.3;
    scores.romantic_dreamer += 0.2;
  } else if (minMax < 4) {
    scores.modern_minimalist += 0.4;
  }

  // High trendy → bold_avant_garde
  if (classicTrendy > 7) {
    scores.bold_avant_garde += 0.3;
    scores.structured_architectural += 0.2;
  } else if (classicTrendy < 4) {
    scores.classic_elegance += 0.4;
  }

  // High flowing → ethereal_goddess, romantic_dreamer
  if (structuredFlowing > 7) {
    scores.ethereal_goddess += 0.3;
    scores.romantic_dreamer += 0.2;
    scores.bohemian_free += 0.1;
  } else if (structuredFlowing < 4) {
    scores.structured_architectural += 0.3;
    scores.power_executive += 0.2;
  }

  // Normalize scores to 0-1 range
  const maxScore = Math.max(...Object.values(scores), 1);
  for (const key of Object.keys(scores)) {
    scores[key] = Math.round((scores[key] / maxScore) * 100) / 100;
  }

  return scores as Record<StyleArchetype, number>;
}

/**
 * Get primary and secondary archetypes from scores
 */
export function getTopArchetypes(
  scores: Record<StyleArchetype, number>,
  count: number = 3
): StyleArchetype[] {
  return (Object.entries(scores) as [StyleArchetype, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([archetype]) => archetype);
}

/**
 * Determine emotional season from color preferences
 */
export function determineEmotionalSeason(
  responses: QuestionnaireResponses
): 'spring' | 'summer' | 'autumn' | 'winter' {
  const colors = (responses.color_preferences as string[]) || [];

  const seasonScores = {
    spring: 0,
    summer: 0,
    autumn: 0,
    winter: 0,
  };

  const colorSeasons: Record<string, keyof typeof seasonScores> = {
    blush: 'spring',
    gold: 'autumn',
    earth_tones: 'autumn',
    ivory: 'spring',
    crimson: 'autumn',
    emerald: 'winter',
    navy: 'winter',
    noir: 'winter',
    silver: 'summer',
    white: 'summer',
    jewel_tones: 'winter',
    burgundy: 'autumn',
  };

  for (const color of colors) {
    const season = colorSeasons[color];
    if (season) seasonScores[season]++;
  }

  return (Object.entries(seasonScores) as [keyof typeof seasonScores, number][])
    .sort(([, a], [, b]) => b - a)[0][0];
}

/**
 * Determine warmth from emotional season
 */
export function determineWarmth(season: string): Warmth {
  if (season === 'spring' || season === 'autumn') return 'warm';
  if (season === 'summer' || season === 'winter') return 'cool';
  return 'neutral';
}
