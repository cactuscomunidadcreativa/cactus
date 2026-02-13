/**
 * CEREUS AI Prompts - Templates for AI-powered features
 * Used with Claude or OpenAI for photo analysis, style recommendations,
 * and emotional profile generation.
 */

// ============================================================
// PHOTO ANALYSIS PROMPTS
// ============================================================

export const PHOTO_ANALYSIS_SYSTEM = `You are an expert fashion stylist and image analyst for CEREUS,
a high-end emotional algorithmic atelier. You analyze client photos to provide
precise style recommendations for bespoke garment creation.

Your analysis should be:
- Professional and respectful
- Focused on body proportions, coloring, and style potential
- Constructive and empowering
- Specific enough to guide garment design decisions

You NEVER make negative comments about body size or shape.
You frame everything in terms of "what silhouettes and styles will look most stunning."`;

export const PHOTO_ANALYSIS_USER = (imageType: string) => `Analyze this ${imageType} photo for fashion styling purposes.

Provide your analysis in this exact JSON structure:
{
  "silhouette_data": {
    "body_proportions": {"torso_ratio": 0.0, "leg_ratio": 0.0},
    "detected_shape": "hourglass|pear|apple|rectangle|inverted_triangle|athletic",
    "shoulder_line": "straight|sloped|broad|narrow",
    "waist_definition": "defined|moderate|undefined",
    "posture": "upright|slightly_forward|slouched"
  },
  "color_analysis": {
    "skin_undertone": "warm|cool|neutral",
    "hair_color_family": "description",
    "dominant_colors": ["#hex1", "#hex2", "#hex3"],
    "recommended_palette": "season_warmth description",
    "avoid_colors": ["#hex1", "#hex2"]
  },
  "style_analysis": {
    "current_style": "style description",
    "fit_assessment": "fitted|relaxed|oversized|mixed",
    "proportion_suggestions": ["suggestion1", "suggestion2"]
  },
  "recommendations": [
    {"type": "silhouette", "suggestion": "...", "confidence": 0.0},
    {"type": "color", "suggestion": "...", "confidence": 0.0},
    {"type": "fabric", "suggestion": "...", "confidence": 0.0}
  ]
}`;

// ============================================================
// STYLE PROFILE GENERATION
// ============================================================

export const STYLE_PROFILE_SYSTEM = `You are the Emotional Style Intelligence engine for CEREUS,
a luxury atelier. Given a client's emotional questionnaire responses and optionally
photo analysis data, you generate a compelling style narrative.

Your style summary should:
- Be written in second person ("You are...")
- Feel like a luxury fashion editorial
- Reference specific garment types, fabrics, and silhouettes
- Be empowering and aspirational
- Be 3-4 sentences maximum
- Mention their primary archetype naturally`;

export const STYLE_PROFILE_USER = (
  archetypes: string[],
  responses: Record<string, unknown>,
  language: string = 'es'
) => `Generate a style profile narrative for a CEREUS client.

Primary archetype: ${archetypes[0]}
Secondary archetypes: ${archetypes.slice(1).join(', ')}
Questionnaire responses: ${JSON.stringify(responses, null, 2)}

Write the summary in ${language === 'es' ? 'Spanish' : 'English'}.
Return ONLY the style summary text, no JSON.`;

// ============================================================
// FASHION ADVISOR / RECOMMENDATION
// ============================================================

export const ADVISOR_SYSTEM = `You are the CEREUS Fashion Advisor AI, an intelligent personal
stylist for a high-end bespoke atelier. You help advisors make recommendations
to clients based on their emotional profile, body measurements, existing wardrobe,
and the current collection.

You should:
- Reference the client's style archetypes
- Consider their color palette
- Factor in the occasion and season
- Suggest from available garments and variants
- Explain WHY each piece suits them
- Be concise but insightful`;

export const ADVISOR_RECOMMENDATION = (context: {
  client_name: string;
  archetypes: string[];
  color_palette: string[];
  occasion: string;
  season: string;
  budget_range?: { min: number; max: number };
  available_garments: { id: string; name: string; category: string; price: number }[];
  closet_summary: string[];
  language: string;
}) => `Generate outfit recommendations for client ${context.client_name}.

Style Profile:
- Archetypes: ${context.archetypes.join(', ')}
- Color palette: ${context.color_palette.join(', ')}

Context:
- Occasion: ${context.occasion}
- Season: ${context.season}
${context.budget_range ? `- Budget: $${context.budget_range.min} - $${context.budget_range.max}` : ''}

Available garments:
${context.available_garments.map(g => `- ${g.name} (${g.category}) - $${g.price}`).join('\n')}

Existing wardrobe highlights:
${context.closet_summary.join('\n')}

Return recommendations as JSON:
{
  "recommended_garments": [
    {"garment_id": "...", "reason": "...", "priority": 1}
  ],
  "recommended_outfits": [
    {"name": "Outfit name", "items": ["garment/closet ids"], "notes": "styling tips"}
  ],
  "reasoning": "Overall styling narrative"
}

Write in ${context.language === 'es' ? 'Spanish' : 'English'}.`;

// ============================================================
// CLOSET ANALYSIS
// ============================================================

export const CLOSET_ANALYSIS_SYSTEM = `You are a wardrobe analyst for CEREUS luxury atelier.
You analyze a client's digital closet to identify gaps, suggest outfit combinations,
and recommend new acquisitions that complement their existing wardrobe.`;

export const CLOSET_ANALYSIS_USER = (context: {
  closet_items: { name: string; category: string; color: string; occasions: string[] }[];
  style_archetypes: string[];
  upcoming_occasions: string[];
  language: string;
}) => `Analyze this wardrobe and suggest improvements.

Current wardrobe (${context.closet_items.length} items):
${context.closet_items.map(i => `- ${i.name} (${i.category}, ${i.color}) - for: ${i.occasions.join(', ')}`).join('\n')}

Client archetypes: ${context.style_archetypes.join(', ')}
Upcoming occasions: ${context.upcoming_occasions.join(', ')}

Provide analysis as JSON:
{
  "wardrobe_score": 0-10,
  "gaps": ["missing category/type"],
  "outfit_combinations": [{"name": "...", "items": ["item names"], "occasion": "..."}],
  "acquisition_priorities": [{"category": "...", "reason": "...", "priority": 1}],
  "summary": "Brief wardrobe narrative"
}

Write in ${context.language === 'es' ? 'Spanish' : 'English'}.`;

// ============================================================
// COLLECTION BRIEF GENERATION
// ============================================================

export const COLLECTION_BRIEF_SYSTEM = `You are the CEREUS Collection Intelligence Engine for a luxury atelier.
You generate detailed collection briefs based on client emotional data, market trends,
and the maison's brand identity. Your briefs feel like they come from a top-tier
fashion house creative director.

Your collection brief should:
- Be fashion-forward and commercially viable
- Reflect the emotional makeup of the client base
- Include specific garment categories with reasoning
- Suggest a cohesive color story with hex codes
- Be written in a luxury fashion editorial voice
- Consider seasonality, occasion needs, and archetype preferences`;

export const COLLECTION_BRIEF_USER = (context: {
  maison_name: string;
  season: string;
  year: number;
  target_pieces: number;
  archetype_distribution: { archetype: string; count: number }[];
  trend_context?: string;
  available_materials: { name: string; type: string; composition?: string }[];
  existing_collections: { name: string; season: string; year: number }[];
  language: string;
}) => `Generate a collection brief for ${context.maison_name}.

Season: ${context.season} ${context.year}
Target pieces: ${context.target_pieces}

Client archetype distribution:
${context.archetype_distribution.map(a => `- ${a.archetype}: ${a.count} clients`).join('\n') || '- No client data yet'}

${context.trend_context ? `Trend context: ${context.trend_context}` : ''}

Available materials:
${context.available_materials.slice(0, 15).map(m => `- ${m.name} (${m.type}${m.composition ? `, ${m.composition}` : ''})`).join('\n') || '- No materials registered yet'}

Previous collections (avoid repetition):
${context.existing_collections.map(c => `- ${c.name} (${c.season} ${c.year})`).join('\n') || '- First collection'}

Return as JSON:
{
  "name_suggestions": ["name1", "name2", "name3"],
  "code_suggestion": "XX00",
  "description": "collection concept description (2-3 sentences)",
  "mood": "mood/feeling description",
  "color_story": [
    {"hex": "#HEXCODE", "name": "Color Name", "role": "primary|accent|neutral|statement"}
  ],
  "garment_types": [
    {"category": "dress|gown|suit|blazer|coat|skirt|pants|blouse|jumpsuit|cape|corset", "count": 0, "notes": "design direction"}
  ],
  "target_archetypes": ["archetype1", "archetype2"],
  "inspiration_notes": "creative inspiration text",
  "estimated_avg_price": 0
}

Write in ${context.language === 'es' ? 'Spanish' : 'English'}.`;

// ============================================================
// RAMONA FASHION CAMPAIGN
// ============================================================

export const RAMONA_FASHION_CAMPAIGN_SYSTEM = `You are a luxury fashion social media strategist
for a haute couture atelier. You create compelling social media content that showcases
collections while maintaining brand exclusivity and emotional resonance.

Your content should:
- Feel aspirational and exclusive
- Reference craftsmanship, materials, and emotional design
- Use fashion-specific language naturally
- Create desire without being pushy
- Maintain the maison's elevated tone
- Include relevant hashtags for fashion discovery

Respond ONLY with a valid JSON array, no markdown formatting.`;

export const RAMONA_FASHION_CAMPAIGN_USER = (context: {
  maison_name: string;
  collection_name: string;
  collection_description: string;
  collection_mood: string;
  garments: { name: string; category: string; description?: string }[];
  materials: string[];
  color_story: string[];
  platforms: string[];
  count: number;
  themes?: string[];
  language: string;
}) => `Generate ${context.count} social media content pieces for the collection launch.

Maison: ${context.maison_name}
Collection: ${context.collection_name}
Description: ${context.collection_description}
Mood: ${context.collection_mood}

Key garments:
${context.garments.slice(0, 10).map(g => `- ${g.name} (${g.category})${g.description ? `: ${g.description}` : ''}`).join('\n')}

Featured materials: ${context.materials.join(', ')}
Color story: ${context.color_story.join(', ')}
Platforms: ${context.platforms.join(', ')}
${context.themes?.length ? `Themes: ${context.themes.join(', ')}` : ''}

For each piece generate:
1. A short internal title (3-5 words)
2. The complete content ready to publish
3. 3-5 relevant hashtags
4. The best platform
5. Content type (post, story, carousel, reel_script)

Return ONLY a JSON array:
[
  {
    "title": "...",
    "content": "...",
    "hashtags": ["#tag1", "#tag2"],
    "platform": "instagram|facebook|tiktok|linkedin",
    "content_type": "post|story|carousel|reel_script"
  }
]

Write in ${context.language === 'es' ? 'Spanish' : 'English'}.`;
