/**
 * Audience Analyzer - Analyzes target audience from social profile URLs
 *
 * Users can provide URLs of their ideal customers' social profiles
 * Ramona analyzes these to understand the target audience better
 */

import { generateContent } from '@/lib/ai';
import { detectSocialPlatform } from './social-scraper';

export interface AudienceProfile {
  demographics: {
    estimated_age_range: string;
    gender_distribution: string;
    location_hints: string;
    occupation_hints: string[];
  };
  psychographics: {
    interests: string[];
    values: string[];
    lifestyle: string[];
    pain_points: string[];
    aspirations: string[];
  };
  behavior: {
    content_preferences: string[];
    active_platforms: string[];
    engagement_patterns: string;
    purchase_triggers: string[];
    decision_factors: string[];
  };
  communication: {
    preferred_tone: string[];
    language_style: string;
    topics_that_resonate: string[];
    content_formats: string[];
  };
}

export interface AudienceAnalysisResult {
  success: boolean;
  profile?: AudienceProfile;
  analyzed_profiles: string[];
  confidence_level: 'high' | 'medium' | 'low';
  recommendations: string[];
  error?: string;
}

/**
 * Analyze target audience from social profile URLs
 */
export async function analyzeAudienceFromProfiles(
  profileUrls: string[],
  businessContext?: string
): Promise<AudienceAnalysisResult> {
  try {
    // Detect platforms and usernames
    const profiles = profileUrls.map(url => detectSocialPlatform(url)).filter(p => p.platform);

    if (profiles.length === 0) {
      return {
        success: false,
        analyzed_profiles: [],
        confidence_level: 'low',
        recommendations: [],
        error: 'No valid social profile URLs detected',
      };
    }

    const profilesDescription = profiles.map(p =>
      `- ${p.platform}: @${p.username}`
    ).join('\n');

    const prompt = `Analiza los siguientes perfiles de redes sociales como representantes del cliente ideal de una marca:

Perfiles del cliente ideal:
${profilesDescription}

${businessContext ? `Contexto del negocio:\n${businessContext}\n\n` : ''}

Basándote en estos perfiles (y tu conocimiento de estos tipos de usuarios/influencers), genera un perfil detallado de la audiencia objetivo.

Responde SOLO con un JSON válido (sin markdown):
{
  "demographics": {
    "estimated_age_range": "rango de edad estimado (ej: 25-40)",
    "gender_distribution": "distribución probable (ej: 60% mujeres, 40% hombres)",
    "location_hints": "ubicación o tipo de ubicación típica",
    "occupation_hints": ["3-5 ocupaciones/roles típicos"]
  },
  "psychographics": {
    "interests": ["5-7 intereses principales"],
    "values": ["3-5 valores importantes para esta audiencia"],
    "lifestyle": ["3-4 características del estilo de vida"],
    "pain_points": ["4-6 problemas o frustraciones comunes"],
    "aspirations": ["3-5 aspiraciones o metas"]
  },
  "behavior": {
    "content_preferences": ["4-6 tipos de contenido que prefieren"],
    "active_platforms": ["plataformas donde son más activos"],
    "engagement_patterns": "cómo y cuándo interactúan con contenido",
    "purchase_triggers": ["3-4 factores que los motivan a comprar"],
    "decision_factors": ["3-4 factores que influyen en sus decisiones"]
  },
  "communication": {
    "preferred_tone": ["2-3 tonos de comunicación que resuenan"],
    "language_style": "estilo de lenguaje preferido",
    "topics_that_resonate": ["4-6 temas que les interesan"],
    "content_formats": ["3-4 formatos de contenido preferidos"]
  },
  "confidence_level": "high | medium | low - basado en cantidad y calidad de perfiles analizados",
  "recommendations": ["3-5 recomendaciones para conectar con esta audiencia"]
}`;

    const aiResult = await generateContent({
      prompt,
      systemPrompt: 'Eres un experto en análisis de audiencia y buyer personas. Creas perfiles detallados de audiencia basados en ejemplos de clientes ideales.',
    });

    const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      profile: {
        demographics: parsed.demographics,
        psychographics: parsed.psychographics,
        behavior: parsed.behavior,
        communication: parsed.communication,
      },
      analyzed_profiles: profiles.map(p => `${p.platform}:${p.username}`),
      confidence_level: parsed.confidence_level || 'medium',
      recommendations: parsed.recommendations || [],
    };

  } catch (error) {
    console.error('Audience analysis error:', error);
    return {
      success: false,
      analyzed_profiles: [],
      confidence_level: 'low',
      recommendations: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate audience profile from scratch (no URLs)
 */
export async function generateAudienceFromDescription(
  productOrService: string,
  targetDescription: string
): Promise<AudienceAnalysisResult> {
  try {
    const prompt = `Crea un perfil detallado de audiencia objetivo para:

Producto/Servicio: ${productOrService}
Descripción del target: ${targetDescription}

Genera un buyer persona detallado y realista.

Responde SOLO con un JSON válido (sin markdown):
{
  "demographics": {
    "estimated_age_range": "rango de edad",
    "gender_distribution": "distribución de género",
    "location_hints": "ubicación típica",
    "occupation_hints": ["ocupaciones típicas"]
  },
  "psychographics": {
    "interests": ["intereses"],
    "values": ["valores"],
    "lifestyle": ["estilo de vida"],
    "pain_points": ["problemas que enfrentan"],
    "aspirations": ["aspiraciones"]
  },
  "behavior": {
    "content_preferences": ["preferencias de contenido"],
    "active_platforms": ["plataformas activas"],
    "engagement_patterns": "patrones de engagement",
    "purchase_triggers": ["triggers de compra"],
    "decision_factors": ["factores de decisión"]
  },
  "communication": {
    "preferred_tone": ["tonos preferidos"],
    "language_style": "estilo de lenguaje",
    "topics_that_resonate": ["temas que resuenan"],
    "content_formats": ["formatos preferidos"]
  },
  "recommendations": ["recomendaciones para conectar"]
}`;

    const aiResult = await generateContent({
      prompt,
      systemPrompt: 'Eres un experto en marketing y creación de buyer personas. Generas perfiles de audiencia detallados y accionables.',
    });

    const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      profile: {
        demographics: parsed.demographics,
        psychographics: parsed.psychographics,
        behavior: parsed.behavior,
        communication: parsed.communication,
      },
      analyzed_profiles: [],
      confidence_level: 'medium',
      recommendations: parsed.recommendations || [],
    };

  } catch (error) {
    console.error('Audience generation error:', error);
    return {
      success: false,
      analyzed_profiles: [],
      confidence_level: 'low',
      recommendations: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Combine brand scraping data with audience analysis
 */
export function generateContentStrategy(
  brandData: {
    tone: string[];
    industry: string;
    value_proposition: string;
    keywords: string[];
  },
  audienceProfile: AudienceProfile
): {
  content_pillars: string[];
  posting_frequency: Record<string, string>;
  content_mix: { type: string; percentage: number }[];
  best_times: string[];
  hashtag_strategy: string[];
  engagement_tactics: string[];
} {
  // Merge brand tone with audience preferences
  const tones = Array.from(new Set([...brandData.tone, ...audienceProfile.communication.preferred_tone]));

  return {
    content_pillars: [
      `Educativo: ${brandData.value_proposition}`,
      `Inspiracional: ${audienceProfile.psychographics.aspirations[0] || 'Historias de éxito'}`,
      `Entretenimiento: ${audienceProfile.psychographics.interests[0] || 'Contenido lifestyle'}`,
      `Promocional: ${brandData.keywords.slice(0, 2).join(', ')}`,
    ],
    posting_frequency: {
      instagram: '4-5 posts/semana + stories diarias',
      facebook: '3-4 posts/semana',
      linkedin: '2-3 posts/semana',
      tiktok: '5-7 videos/semana',
      twitter: '7-10 tweets/semana',
    },
    content_mix: [
      { type: 'Educativo', percentage: 30 },
      { type: 'Entretenimiento', percentage: 25 },
      { type: 'Inspiracional', percentage: 20 },
      { type: 'Promocional', percentage: 15 },
      { type: 'UGC/Comunidad', percentage: 10 },
    ],
    best_times: [
      'Lunes-Viernes: 8-9am, 12-1pm, 7-9pm',
      'Sábados: 10am-12pm',
      'Domingos: 4-6pm',
    ],
    hashtag_strategy: [
      `Marca: #${brandData.keywords[0]?.replace(/\s+/g, '')}`,
      `Industria: #${brandData.industry.replace(/\s+/g, '')}`,
      `Comunidad: ${audienceProfile.communication.topics_that_resonate.slice(0, 3).map(t => `#${t.replace(/\s+/g, '')}`).join(' ')}`,
    ],
    engagement_tactics: [
      'Responder comentarios en < 1 hora',
      `Crear contenido sobre: ${audienceProfile.psychographics.pain_points.slice(0, 2).join(', ')}`,
      `Tono principal: ${tones[0]}`,
      'Usar CTAs claros en cada post',
    ],
  };
}
