import { NextRequest, NextResponse } from 'next/server';
import { getAPIKey } from '@/lib/ai/config';
import { getTrendSuggestions, getTrendData, buildDesignPrompt } from '@/modules/cereus/lib/trend-engine';
import { getTrainingContext } from '@/modules/cereus/lib/ai-training-context';
import { uploadImageToSupabase } from '@/modules/cereus/lib/image-upload';

/**
 * Generate a fashion sketch with trend intelligence.
 * Uses Claude for design analysis + DALL-E or enhanced SVG for visuals.
 * POST body: { template, fabric, colors, collectionName, season, maisonId }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { template, fabric, fabrics, colors, collectionName, season, lang, maisonId } = body;

  if (!template) {
    return NextResponse.json({ error: 'template required' }, { status: 400 });
  }

  // Support single fabric or array of fabrics
  const fabricList: string[] = fabrics || (fabric ? [fabric] : ['silk']);
  const fabricName = fabricList.join(', ');
  const colorList = colors || ['#0A0A0A', '#B8943A'];
  const language = lang || 'es'; // Default to Spanish

  // Load AI training context
  const trainingContext = maisonId ? await getTrainingContext(maisonId) : '';

  // Get trend data
  const trends = getTrendData(season);
  const suggestions = getTrendSuggestions(template, fabricName, season);

  // ─── Step 1: Try Claude for design brief ──────────────────
  let designBrief: DesignBrief | null = null;

  try {
    const anthropicKey = await getAPIKey('claude');
    if (anthropicKey) {
      designBrief = await generateDesignBrief(anthropicKey, template, fabricName, colorList, season, collectionName, language, trainingContext);
    }
  } catch {
    // Continue without Claude brief
  }

  // ─── Step 2: Try DALL-E for image ─────────────────────────
  let openaiKey = '';
  try {
    openaiKey = await getAPIKey('openai') || '';
  } catch { /* */ }

  if (openaiKey) {
    try {
      const dallePrompt = designBrief?.dallePrompt || buildDallePrompt(template, fabricName, colorList, suggestions);

      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: dallePrompt,
          n: 1,
          size: '1024x1024',
          quality: 'hd',
          response_format: 'url',
        }),
      });

      const data = await res.json();
      if (data.data?.[0]?.url) {
        const dalleUrl = data.data[0].url;
        // Upload to Supabase with retry for permanent URL
        const { createServiceClient: createSvc } = await import('@/lib/supabase/service');
        const db = createSvc();
        let finalImageUrl = dalleUrl;
        let uploadWarning: string | null = null;
        if (db) {
          const result = await uploadImageToSupabase(db, dalleUrl, 'sketches');
          finalImageUrl = result.permanentUrl || dalleUrl;
          uploadWarning = result.warning;
        }

        const svgFallback = generateTrendSVG(template, colorList, fabricName, suggestions, designBrief)
          .replace(/<!--[\s\S]*?-->/g, '');
        return NextResponse.json({
          imageUrl: finalImageUrl,
          warning: uploadWarning,
          svgData: svgFallback,
          source: 'dall-e',
          designBrief,
          trends: {
            silhouette: suggestions.silhouette,
            colorStory: suggestions.colorStory,
            fabricTrend: suggestions.fabricTrend,
            details: suggestions.details,
            mood: trends.moodKeywords,
          },
        });
      }
    } catch { /* Fall through */ }
  }

  // ─── Step 3: Enhanced SVG with trend data ─────────────────
  const svgRaw = generateTrendSVG(template, colorList, fabricName, suggestions, designBrief);
  // Strip XML comments that can break image rendering in browsers
  const svgSketch = svgRaw.replace(/<!--[\s\S]*?-->/g, '');

  return NextResponse.json({
    svgData: svgSketch,
    source: designBrief ? 'svg-with-ai-brief' : 'svg-with-trends',
    designBrief,
    trends: {
      silhouette: suggestions.silhouette,
      colorStory: suggestions.colorStory,
      fabricTrend: suggestions.fabricTrend,
      details: suggestions.details,
      mood: trends.moodKeywords,
    },
    message: designBrief
      ? 'Boceto generado con analisis de tendencias IA'
      : 'Boceto generado con tendencias de moda integradas',
  });
}

// ─── Types ──────────────────────────────────────────────────

interface DesignBrief {
  concept: string;
  silhouetteNotes: string;
  fabricNotes: string;
  colorNotes: string;
  constructionDetails: string[];
  trendAlignment: string;
  designerTips: string;
  dallePrompt: string;
}

// ─── Claude Design Brief ────────────────────────────────────

async function generateDesignBrief(
  apiKey: string,
  template: string,
  fabric: string,
  colors: string[],
  season?: string,
  collectionName?: string,
  language: string = 'es',
  trainingContext: string = '',
): Promise<DesignBrief> {
  const trends = getTrendData(season);
  const suggestions = getTrendSuggestions(template, fabric, season);

  const isSpanish = language === 'es';

  const garmentNamesES: Record<string, string> = {
    dress: 'vestido', blouse: 'blusa', skirt: 'falda',
    pants: 'pantalon', jacket: 'chaqueta', top: 'top',
  };
  const garmentLabel = isSpanish ? (garmentNamesES[template] || template) : template;

  const systemPrompt = isSpanish
    ? `Eres un disenador de alta costura experto y pronosticador de tendencias de moda. Analizas tendencias y creas conceptos de diseno para piezas de moda de lujo. SIEMPRE responde en espanol. Responde SOLO en formato JSON. Se especifico, creativo y vanguardista.`
    : `You are an expert haute couture fashion designer and trend forecaster. You analyze trends and create design concepts for luxury fashion pieces. Always respond in JSON format. Be specific, creative, and trend-forward.`;

  const userPrompt = isSpanish
    ? `Crea un brief de diseno para un/una ${garmentLabel} en ${fabric} usando estos colores: ${colors.join(', ')}.

Temporada: ${trends.season} ${trends.year}
${collectionName ? `Coleccion: "${collectionName}"` : ''}

Tendencias actuales:
- Silueta en tendencia: ${suggestions.silhouette?.name} - ${suggestions.silhouette?.description}
- Tela en tendencia: ${suggestions.fabricTrend?.name} - ${suggestions.fabricTrend?.description}
- Detalles: ${suggestions.details.map(d => `${d.name}: ${d.elements.join(', ')}`).join('; ')}
- Mood: ${trends.moodKeywords.join(', ')}

IMPORTANTE: Responde TODO en espanol. Responde SOLO con este JSON:
{
  "concept": "Una frase creativa describiendo el concepto de esta pieza (en espanol)",
  "silhouetteNotes": "Descripcion especifica de la silueta con proporciones (en espanol)",
  "fabricNotes": "Como usar la tela, caida, peso, consideraciones (en espanol)",
  "colorNotes": "Como aplicar los colores en la prenda (en espanol)",
  "constructionDetails": ["detalle 1 en espanol", "detalle 2", "detalle 3", "detalle 4"],
  "trendAlignment": "Como esta pieza se alinea con las tendencias ${trends.season} ${trends.year} (en espanol)",
  "designerTips": "Tip profesional para que esta pieza destaque en pasarela (en espanol)",
  "dallePrompt": "A detailed DALL-E prompt in ENGLISH for generating a fashion sketch of this specific design (include: haute couture pencil sketch, white paper, fashion illustration proportions, specific construction details)"
}`
    : `Create a design brief for a ${template} in ${fabric} using these colors: ${colors.join(', ')}.

Season: ${trends.season} ${trends.year}
${collectionName ? `Collection: "${collectionName}"` : ''}

Current trends:
- Silhouette trend: ${suggestions.silhouette?.name} - ${suggestions.silhouette?.description}
- Fabric trend: ${suggestions.fabricTrend?.name} - ${suggestions.fabricTrend?.description}
- Details: ${suggestions.details.map(d => `${d.name}: ${d.elements.join(', ')}`).join('; ')}
- Mood: ${trends.moodKeywords.join(', ')}

Respond with this JSON structure:
{
  "concept": "One sentence creative concept for this piece",
  "silhouetteNotes": "Specific silhouette description with measurements/proportions",
  "fabricNotes": "How the fabric should be used, drape, weight considerations",
  "colorNotes": "How colors should be applied across the garment",
  "constructionDetails": ["detail 1", "detail 2", "detail 3", "detail 4"],
  "trendAlignment": "How this piece aligns with current ${trends.season} ${trends.year} trends",
  "designerTips": "Pro tip for making this piece stand out on the runway",
  "dallePrompt": "A detailed DALL-E prompt for generating a fashion sketch of this specific design"
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      temperature: 0.8,
      system: systemPrompt,
      messages: [{ role: 'user', content: trainingContext ? `${trainingContext}\n\n${userPrompt}` : userPrompt }],
    }),
  });

  const data = await res.json();
  const text = data.content?.[0]?.text || '';

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]) as DesignBrief;
  }

  throw new Error('Failed to parse design brief');
}

// ─── DALL-E Prompt Builder ──────────────────────────────────

function buildDallePrompt(
  template: string,
  fabric: string,
  colors: string[],
  suggestions: ReturnType<typeof getTrendSuggestions>,
): string {
  const garmentNames: Record<string, string> = {
    dress: 'elegant dress',
    blouse: 'designer blouse',
    skirt: 'haute couture skirt',
    pants: 'tailored wide-leg pants',
    jacket: 'structured designer jacket',
    top: 'avant-garde top',
  };

  const silhouetteDesc = suggestions.silhouette
    ? `${suggestions.silhouette.name} silhouette: ${suggestions.silhouette.keywords.join(', ')}.`
    : '';

  const detailDesc = suggestions.details.length > 0
    ? `Details: ${suggestions.details.flatMap(d => d.elements.slice(0, 2)).join(', ')}.`
    : '';

  return `Fashion design illustration of a ${garmentNames[template] || template} made of ${fabric}. ${silhouetteDesc} ${detailDesc} Color palette: ${colors.join(', ')}. Style: haute couture pencil sketch on cream paper, 9-head fashion proportion figure, visible construction lines, seam notations, fabric drape indicators, minimal background. Technical fashion drawing with light watercolor accents suggesting fabric texture. Editorial quality, runway-ready design.`;
}

// ─── Enhanced SVG with Trend Intelligence ───────────────────

function generateTrendSVG(
  template: string,
  colors: string[],
  fabric: string,
  suggestions: ReturnType<typeof getTrendSuggestions>,
  brief: DesignBrief | null,
): string {
  const primary = colors[0] || '#1a1a1a';
  const accent = colors[1] || '#B8943A';
  const bg = '#FAFAF7';

  // 9-head proportion fashion figure (total height ~450)
  const headH = 50;

  const fabricPatterns = getFabricPattern(fabric, accent);

  const garmentSVG = getGarmentSVG(template, primary, accent, colors, suggestions);

  // Construction annotations based on trend/brief
  const annotations = brief?.constructionDetails || suggestions.details.flatMap(d => d.elements.slice(0, 2));

  // Sanitize text for SVG XML
  function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  const annotationSVG = annotations.slice(0, 4).map((note, i) => {
    const y = 100 + i * 90;
    const side = i % 2 === 0 ? 'right' : 'left';
    const lineX = side === 'right' ? 300 : 100;
    const textX = side === 'right' ? 310 : 10;
    const dotX = side === 'right' ? 260 : 140;
    const safeNote = esc(note.length > 22 ? note.substring(0, 22) + '...' : note);
    return `
      <circle cx="${dotX}" cy="${y}" r="2" fill="${accent}" opacity="0.6"/>
      <line x1="${dotX}" y1="${y}" x2="${lineX}" y2="${y}" stroke="${accent}" stroke-width="0.4" stroke-dasharray="3,3" opacity="0.4"/>
      <text x="${textX}" y="${y + 3}" font-family="sans-serif" font-size="7" fill="${primary}" opacity="0.5">
        ${safeNote}
      </text>
    `;
  }).join('');

  // Color swatches
  const swatches = colors.slice(0, 6).map((c, i) =>
    `<rect x="${125 + i * 26}" y="${465}" width="22" height="22" rx="4" fill="${c}" stroke="${primary}" stroke-width="0.4" opacity="0.8"/>
     <rect x="${125 + i * 26}" y="${465}" width="22" height="22" rx="4" fill="none" stroke="white" stroke-width="0.5" opacity="0.3"/>`
  ).join('');

  // Trend badge
  const trendName = esc(suggestions.silhouette?.name || 'Haute Couture');
  const moodText = esc(suggestions.colorStory?.mood || 'sophisticated');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" width="600" height="780">
    <rect width="400" height="520" fill="${bg}"/>

    <defs>
      ${fabricPatterns}
    </defs>

    <!-- Page frame -->
    <rect x="15" y="15" width="370" height="490" fill="none" stroke="${primary}" stroke-width="0.2" opacity="0.1" rx="2"/>

    <!-- Corner marks -->
    <line x1="20" y1="20" x2="38" y2="20" stroke="${primary}" stroke-width="0.3" opacity="0.15"/>
    <line x1="20" y1="20" x2="20" y2="38" stroke="${primary}" stroke-width="0.3" opacity="0.15"/>
    <line x1="380" y1="20" x2="362" y2="20" stroke="${primary}" stroke-width="0.3" opacity="0.15"/>
    <line x1="380" y1="20" x2="380" y2="38" stroke="${primary}" stroke-width="0.3" opacity="0.15"/>
    <line x1="20" y1="500" x2="38" y2="500" stroke="${primary}" stroke-width="0.3" opacity="0.15"/>
    <line x1="20" y1="500" x2="20" y2="482" stroke="${primary}" stroke-width="0.3" opacity="0.15"/>
    <line x1="380" y1="500" x2="362" y2="500" stroke="${primary}" stroke-width="0.3" opacity="0.15"/>
    <line x1="380" y1="500" x2="380" y2="482" stroke="${primary}" stroke-width="0.3" opacity="0.15"/>

    <!-- Trend label top -->
    <text x="200" y="32" text-anchor="middle" font-family="sans-serif" font-size="6.5" fill="${accent}" opacity="0.6" letter-spacing="3">
      ${trendName.toUpperCase()} - ${esc(suggestions.colorStory?.name?.toUpperCase() || 'COLLECTION')}
    </text>

    <!-- Fashion figure with garment -->
    <g transform="translate(0, 8)">
      ${garmentSVG}
    </g>

    <!-- Annotations -->
    <g>
      ${annotationSVG}
    </g>

    <!-- Color swatches -->
    ${swatches}

    <!-- Fabric + Mood label -->
    <text x="200" y="500" text-anchor="middle" font-family="Georgia, serif" font-size="9" fill="${primary}" opacity="0.35" letter-spacing="1.5">
      ${esc((fabric || 'Silk').toUpperCase())} - ${moodText.toUpperCase()}
    </text>

    <!-- Trend season -->
    <text x="200" y="512" text-anchor="middle" font-family="sans-serif" font-size="6" fill="${accent}" opacity="0.3" letter-spacing="2">
      ${esc(suggestions.silhouette?.keywords?.slice(0, 3).join(' - ').toUpperCase() || 'HAUTE COUTURE')}
    </text>
  </svg>`;
}

// ─── Fabric Pattern SVG Definitions ─────────────────────────

function getFabricPattern(fabric: string, accent: string): string {
  const key = fabric.toLowerCase().replace(/\s+/g, '');
  const patterns: Record<string, string> = {
    silk: `<pattern id="tex" width="30" height="30" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="30" y2="30" stroke="${accent}" stroke-width="0.3" opacity="0.10"/>
      <line x1="10" y1="0" x2="30" y2="20" stroke="${accent}" stroke-width="0.15" opacity="0.06"/>
    </pattern>`,
    seda: `<pattern id="tex" width="30" height="30" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="30" y2="30" stroke="${accent}" stroke-width="0.3" opacity="0.10"/>
    </pattern>`,
    velvet: `<pattern id="tex" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="1.8" fill="${accent}" opacity="0.05"/>
    </pattern>`,
    terciopelo: `<pattern id="tex" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="1.8" fill="${accent}" opacity="0.05"/>
    </pattern>`,
    linen: `<pattern id="tex" width="10" height="10" patternUnits="userSpaceOnUse">
      <line x1="0" y1="5" x2="10" y2="5" stroke="${accent}" stroke-width="0.3" opacity="0.07"/>
      <line x1="5" y1="0" x2="5" y2="10" stroke="${accent}" stroke-width="0.3" opacity="0.07"/>
    </pattern>`,
    lino: `<pattern id="tex" width="10" height="10" patternUnits="userSpaceOnUse">
      <line x1="0" y1="5" x2="10" y2="5" stroke="${accent}" stroke-width="0.3" opacity="0.07"/>
      <line x1="5" y1="0" x2="5" y2="10" stroke="${accent}" stroke-width="0.3" opacity="0.07"/>
    </pattern>`,
    chiffon: `<pattern id="tex" width="25" height="25" patternUnits="userSpaceOnUse">
      <path d="M0,12 Q12,6 25,12" stroke="${accent}" stroke-width="0.2" fill="none" opacity="0.05"/>
    </pattern>`,
    organza: `<pattern id="tex" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M0,10 Q10,5 20,10" stroke="${accent}" stroke-width="0.15" fill="none" opacity="0.04"/>
    </pattern>`,
    lace: `<pattern id="tex" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="8" cy="8" r="5" stroke="${accent}" stroke-width="0.3" fill="none" opacity="0.08"/>
      <circle cx="0" cy="0" r="3" stroke="${accent}" stroke-width="0.2" fill="none" opacity="0.06"/>
      <circle cx="16" cy="16" r="3" stroke="${accent}" stroke-width="0.2" fill="none" opacity="0.06"/>
    </pattern>`,
    encaje: `<pattern id="tex" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="8" cy="8" r="5" stroke="${accent}" stroke-width="0.3" fill="none" opacity="0.08"/>
    </pattern>`,
    denim: `<pattern id="tex" width="4" height="4" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="4" y2="4" stroke="${accent}" stroke-width="0.4" opacity="0.08"/>
    </pattern>`,
    leather: `<pattern id="tex" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M0,10 C5,8 8,12 10,10 C12,8 15,12 20,10" stroke="${accent}" stroke-width="0.3" fill="none" opacity="0.05"/>
    </pattern>`,
    cuero: `<pattern id="tex" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M0,10 C5,8 8,12 10,10" stroke="${accent}" stroke-width="0.3" fill="none" opacity="0.05"/>
    </pattern>`,
    taffeta: `<pattern id="tex" width="15" height="15" patternUnits="userSpaceOnUse">
      <line x1="0" y1="7" x2="15" y2="7" stroke="${accent}" stroke-width="0.2" opacity="0.06"/>
    </pattern>`,
    cotton: `<pattern id="tex" width="8" height="8" patternUnits="userSpaceOnUse">
      <line x1="0" y1="4" x2="8" y2="4" stroke="${accent}" stroke-width="0.15" opacity="0.05"/>
      <line x1="4" y1="0" x2="4" y2="8" stroke="${accent}" stroke-width="0.15" opacity="0.05"/>
    </pattern>`,
    algodon: `<pattern id="tex" width="8" height="8" patternUnits="userSpaceOnUse">
      <line x1="0" y1="4" x2="8" y2="4" stroke="${accent}" stroke-width="0.15" opacity="0.05"/>
      <line x1="4" y1="0" x2="4" y2="8" stroke="${accent}" stroke-width="0.15" opacity="0.05"/>
    </pattern>`,
    crepe: `<pattern id="tex" width="12" height="12" patternUnits="userSpaceOnUse">
      <path d="M0,6 Q3,3 6,6 Q9,9 12,6" stroke="${accent}" stroke-width="0.2" fill="none" opacity="0.06"/>
    </pattern>`,
    shantung: `<pattern id="tex" width="20" height="8" patternUnits="userSpaceOnUse">
      <line x1="0" y1="4" x2="20" y2="4" stroke="${accent}" stroke-width="0.3" opacity="0.06"/>
      <line x1="5" y1="2" x2="15" y2="6" stroke="${accent}" stroke-width="0.15" opacity="0.04"/>
    </pattern>`,
  };

  return patterns[key] || patterns.silk || `<pattern id="tex" width="20" height="20" patternUnits="userSpaceOnUse">
    <line x1="0" y1="0" x2="20" y2="20" stroke="${accent}" stroke-width="0.2" opacity="0.06"/>
  </pattern>`;
}

// ─── Garment SVG with Fashion Figure ────────────────────────

function getGarmentSVG(
  template: string,
  primary: string,
  accent: string,
  colors: string[],
  suggestions: ReturnType<typeof getTrendSuggestions>,
): string {
  const tertiary = colors[2] || '#888888';

  // Fashion figure base (9-head proportions, centered at x=200)
  const head = `
    <ellipse cx="200" cy="45" rx="10" ry="13" stroke="${primary}" stroke-width="0.7" fill="none" opacity="0.25"/>
    <path d="M196,30 Q200,24 204,30" stroke="${primary}" stroke-width="0.5" fill="none" opacity="0.15"/>
    <line x1="200" y1="58" x2="200" y2="70" stroke="${primary}" stroke-width="0.5" opacity="0.2"/>
  `;

  const arm = (side: number) => `
    <path d="M${200 + side * 42},${92} Q${200 + side * 58},${132} ${200 + side * 52},${175}"
      stroke="${primary}" stroke-width="0.6" fill="none" opacity="0.18"/>
    <path d="M${200 + side * 52},${175} L${200 + side * 50},${192}"
      stroke="${primary}" stroke-width="0.4" fill="none" opacity="0.13"/>
  `;

  const legs = (startY: number) => `
    <line x1="190" y1="${startY}" x2="182" y2="${startY + 135}" stroke="${primary}" stroke-width="0.6" opacity="0.18"/>
    <line x1="210" y1="${startY}" x2="218" y2="${startY + 135}" stroke="${primary}" stroke-width="0.6" opacity="0.18"/>
    <path d="M182,${startY + 135} L172,${startY + 142}" stroke="${primary}" stroke-width="0.5" opacity="0.12"/>
    <path d="M218,${startY + 135} L228,${startY + 142}" stroke="${primary}" stroke-width="0.5" opacity="0.12"/>
  `;

  // Determine trend-specific detail keywords
  const hasVolume = suggestions.silhouette?.keywords?.some(k => k.includes('oversized') || k.includes('volume') || k.includes('puff'));
  const hasAsymmetry = suggestions.silhouette?.keywords?.some(k => k.includes('asymmetric'));
  const hasDrape = suggestions.silhouette?.keywords?.some(k => k.includes('fluid') || k.includes('draped') || k.includes('bias'));
  const hasCutouts = suggestions.details?.some(d => d.elements.some(e => e.includes('cutout') || e.includes('reveal')));

  const garments: Record<string, string> = {
    dress: `
      ${head}
      <!-- Dress: main body -->
      <path d="M200,70 C172,70 ${hasVolume ? '150' : '158'},84 ${hasVolume ? '148' : '155'},108
        L${hasVolume ? '145' : '150'},145
        C${hasVolume ? '138' : '145'},215 ${hasVolume ? '125' : '135'},300 ${hasVolume ? '108' : '120'},395
        Q${hasVolume ? '105' : '118'},408 ${hasVolume ? '112' : '125'},410
        L${hasVolume ? '288' : '275'},410
        Q${hasVolume ? '295' : '282'},408 ${hasVolume ? '292' : '280'},395
        C${hasVolume ? '275' : '265'},300 ${hasVolume ? '262' : '255'},215 ${hasVolume ? '255' : '250'},145
        L${hasVolume ? '252' : '250'},108
        C${hasVolume ? '250' : '245'},84 ${hasVolume ? '228' : '242'},70 200,70 Z"
        stroke="${primary}" stroke-width="1.4" fill="url(#tex)" opacity="0.85"/>

      <!-- Second pencil stroke -->
      <path d="M200,70 C172,70 158,84 155,108 L150,145 C145,215 135,300 120,395 Q118,408 125,410 L275,410 Q282,408 280,395 C265,300 255,215 250,145 L245,108 C242,84 228,70 200,70 Z"
        stroke="${primary}" stroke-width="0.4" fill="none" stroke-dasharray="6,4" opacity="0.2" transform="translate(1,0.5)"/>

      <!-- Neckline ${hasAsymmetry ? '(asymmetric)' : ''} -->
      ${hasAsymmetry
        ? `<path d="M168,80 Q185,98 200,90 Q225,82 235,75" stroke="${primary}" stroke-width="1.1" fill="none"/>`
        : `<path d="M168,80 Q200,98 232,80" stroke="${primary}" stroke-width="1.1" fill="none"/>`
      }

      <!-- Waist definition -->
      <path d="M158,182 Q200,${hasDrape ? '198' : '192'} 242,182" stroke="${accent}" stroke-width="0.7" fill="none" stroke-dasharray="4,3" opacity="0.45"/>

      <!-- Drape/flow lines -->
      ${hasDrape ? `
        <path d="M170,120 Q165,200 145,320 Q138,370 125,400" stroke="${primary}" stroke-width="0.5" fill="none" opacity="0.15"/>
        <path d="M230,120 Q235,200 255,320 Q262,370 275,400" stroke="${primary}" stroke-width="0.5" fill="none" opacity="0.15"/>
        <path d="M185,150 Q178,250 155,380" stroke="${primary}" stroke-width="0.3" fill="none" opacity="0.1"/>
        <path d="M215,150 Q222,250 245,380" stroke="${primary}" stroke-width="0.3" fill="none" opacity="0.1"/>
      ` : `
        <path d="M180,200 Q178,300 165,395" stroke="${primary}" stroke-width="0.3" fill="none" opacity="0.15"/>
        <path d="M220,200 Q222,300 235,395" stroke="${primary}" stroke-width="0.3" fill="none" opacity="0.15"/>
      `}
      <path d="M200,190 L200,405" stroke="${primary}" stroke-width="0.2" fill="none" opacity="0.1"/>

      ${hasCutouts ? `
        <!-- Cutout detail -->
        <ellipse cx="200" cy="140" rx="12" ry="8" stroke="${accent}" stroke-width="0.6" fill="${accent}08" stroke-dasharray="2,2"/>
      ` : ''}

      <!-- Hem detail -->
      <path d="M125,408 Q200,418 275,408" stroke="${accent}" stroke-width="0.5" fill="none" opacity="0.35"/>

      <!-- Sleeve/shoulder hints -->
      ${hasVolume ? `
        <path d="M158,84 Q140,80 130,95 Q125,110 135,120" stroke="${primary}" stroke-width="0.8" fill="${primary}05"/>
        <path d="M242,84 Q260,80 270,95 Q275,110 265,120" stroke="${primary}" stroke-width="0.8" fill="${primary}05"/>
      ` : `
        ${arm(-1)}
        ${arm(1)}
      `}

      ${legs(410)}
    `,

    blouse: `
      ${head}
      <!-- Blouse body -->
      <path d="M200,70 C172,70 ${hasVolume ? '148' : '155'},82 ${hasVolume ? '144' : '150'},102
        L${hasVolume ? '125' : '135'},135 Q${hasVolume ? '118' : '128'},148 ${hasVolume ? '128' : '138'},155
        L${hasVolume ? '148' : '155'},162
        L${hasVolume ? '145' : '150'},265 Q150,275 160,275
        L240,275 Q250,275 250,265
        L${hasVolume ? '255' : '245'},162
        L${hasVolume ? '272' : '262'},155 Q${hasVolume ? '282' : '272'},148 ${hasVolume ? '275' : '265'},135
        L${hasVolume ? '256' : '250'},102
        C${hasVolume ? '252' : '245'},82 ${hasVolume ? '228' : '225'},70 200,70 Z"
        stroke="${primary}" stroke-width="1.4" fill="url(#tex)" opacity="0.85"/>

      <!-- Second stroke -->
      <path d="M200,70 C172,70 155,82 150,102 L135,135 Q128,148 138,155 L155,162 L150,265 Q150,275 160,275 L240,275 Q250,275 250,265 L245,162 L262,155 Q272,148 265,135 L250,102 C245,82 228,70 200,70 Z"
        stroke="${primary}" stroke-width="0.35" fill="none" stroke-dasharray="5,3" opacity="0.2" transform="translate(0.8,0.4)"/>

      <!-- Collar -->
      <path d="M175,76 Q200,92 225,76" stroke="${primary}" stroke-width="1.1" fill="none"/>
      <path d="M168,78 L183,98 L200,82 L217,98 L232,78" stroke="${accent}" stroke-width="0.7" fill="none" opacity="0.4"/>

      ${hasVolume ? `
        <!-- Puff sleeves -->
        <ellipse cx="135" cy="125" rx="18" ry="22" stroke="${primary}" stroke-width="0.7" fill="${primary}04" transform="rotate(-15 135 125)"/>
        <ellipse cx="265" cy="125" rx="18" ry="22" stroke="${primary}" stroke-width="0.7" fill="${primary}04" transform="rotate(15 265 125)"/>
      ` : ''}

      <!-- Button line -->
      ${[115, 145, 175, 205, 240].map(y => `<circle cx="200" cy="${y}" r="1.8" stroke="${accent}" stroke-width="0.5" fill="none" opacity="0.35"/>`).join('')}

      <!-- Hem -->
      <path d="M160,273 Q200,280 240,273" stroke="${accent}" stroke-width="0.5" fill="none" opacity="0.35"/>

      ${arm(-1)}${arm(1)}
      ${legs(275)}
    `,

    skirt: `
      ${head}
      <!-- Upper body hint -->
      <path d="M188,70 L186,145 M212,70 L214,145" stroke="${primary}" stroke-width="0.4" fill="none" opacity="0.15"/>
      <path d="M186,90 Q170,100 165,110" stroke="${primary}" stroke-width="0.3" fill="none" opacity="0.12"/>
      <path d="M214,90 Q230,100 235,110" stroke="${primary}" stroke-width="0.3" fill="none" opacity="0.12"/>

      ${arm(-1)}${arm(1)}

      <!-- Skirt -->
      <path d="M172,145 L168,165 C${hasVolume ? '155' : '160'},250 ${hasVolume ? '135' : '145'},340 ${hasVolume ? '110' : '122'},420
        Q${hasVolume ? '107' : '120'},432 ${hasVolume ? '115' : '128'},434
        L${hasVolume ? '285' : '272'},434
        Q${hasVolume ? '293' : '280'},432 ${hasVolume ? '290' : '278'},420
        C${hasVolume ? '265' : '255'},340 ${hasVolume ? '245' : '240'},250 ${hasVolume ? '232' : '240'},165
        L228,145 Z"
        stroke="${primary}" stroke-width="1.4" fill="url(#tex)" opacity="0.85"/>

      <!-- Second stroke -->
      <path d="M172,145 L168,165 C160,250 145,340 122,420 Q120,432 128,434 L272,434 Q280,432 278,420 C255,340 240,250 240,165 L228,145 Z"
        stroke="${primary}" stroke-width="0.35" fill="none" stroke-dasharray="5,3" opacity="0.2" transform="translate(0.8,0.4)"/>

      <!-- Waistband -->
      <rect x="170" y="143" width="60" height="8" rx="2" stroke="${primary}" stroke-width="0.8" fill="${accent}12"/>

      <!-- Flow lines -->
      <path d="M185,165 Q180,290 ${hasVolume ? '148' : '158'},420" stroke="${primary}" stroke-width="0.3" fill="none" opacity="0.15"/>
      <path d="M215,165 Q220,290 ${hasVolume ? '252' : '242'},420" stroke="${primary}" stroke-width="0.3" fill="none" opacity="0.15"/>
      <path d="M200,153 Q200,310 200,432" stroke="${primary}" stroke-width="0.2" fill="none" opacity="0.1"/>

      <!-- Hem -->
      <path d="M128,432 Q200,442 272,432" stroke="${accent}" stroke-width="0.5" fill="none" opacity="0.35"/>

      ${legs(435)}
    `,

    pants: `
      ${head}
      <!-- Upper body hint -->
      <path d="M188,70 L185,145 M212,70 L215,145" stroke="${primary}" stroke-width="0.4" fill="none" opacity="0.15"/>

      ${arm(-1)}${arm(1)}

      <!-- Pants -->
      <path d="M170,145 L166,225 L${hasVolume ? '140' : '150'},430 Q${hasVolume ? '138' : '148'},438 ${hasVolume ? '148' : '158'},438
        L${hasVolume ? '198' : '195'},438 Q200,438 200,430
        L202,268
        L204,430 Q204,438 ${hasVolume ? '208' : '210'},438
        L${hasVolume ? '258' : '248'},438 Q${hasVolume ? '268' : '258'},438 ${hasVolume ? '266' : '256'},430
        L${hasVolume ? '240' : '250'},225 L236,145 Z"
        stroke="${primary}" stroke-width="1.4" fill="url(#tex)" opacity="0.85"/>

      <!-- Second stroke -->
      <path d="M170,145 L166,225 L150,430 Q148,438 158,438 L195,438 Q200,438 200,430 L202,268 L204,430 Q204,438 210,438 L248,438 Q258,438 256,430 L250,225 L236,145 Z"
        stroke="${primary}" stroke-width="0.35" fill="none" stroke-dasharray="5,3" opacity="0.2" transform="translate(0.8,0.4)"/>

      <!-- Waistband -->
      <rect x="168" y="143" width="70" height="10" rx="2" stroke="${primary}" stroke-width="0.8" fill="${accent}12"/>

      <!-- Crease lines -->
      <line x1="180" y1="165" x2="${hasVolume ? '168' : '175'}" y2="430" stroke="${primary}" stroke-width="0.25" opacity="0.15"/>
      <line x1="225" y1="165" x2="${hasVolume ? '238' : '232'}" y2="430" stroke="${primary}" stroke-width="0.25" opacity="0.15"/>

      <!-- Pocket details -->
      <path d="M175,160 Q182,168 177,176" stroke="${accent}" stroke-width="0.5" fill="none" opacity="0.3"/>
      <path d="M231,160 Q224,168 229,176" stroke="${accent}" stroke-width="0.5" fill="none" opacity="0.3"/>
    `,

    jacket: `
      ${head}
      <!-- Jacket body -->
      <path d="M200,65 C168,65 145,82 140,110
        L${hasVolume ? '108' : '118'},142 Q${hasVolume ? '100' : '110'},155 ${hasVolume ? '112' : '120'},165
        L140,175
        L136,320 Q136,330 148,330
        L190,330 L190,195 L200,185 L210,195 L210,330
        L252,330 Q264,330 264,320
        L260,175
        L${hasVolume ? '288' : '280'},165 Q${hasVolume ? '300' : '290'},155 ${hasVolume ? '292' : '282'},142
        L260,110
        C255,82 232,65 200,65 Z"
        stroke="${primary}" stroke-width="1.4" fill="url(#tex)" opacity="0.85"/>

      <!-- Second stroke -->
      <path d="M200,65 C168,65 145,82 140,110 L118,142 Q110,155 120,165 L140,175 L136,320 Q136,330 148,330 L190,330 L190,195 L200,185 L210,195 L210,330 L252,330 Q264,330 264,320 L260,175 L280,165 Q290,155 282,142 L260,110 C255,82 232,65 200,65 Z"
        stroke="${primary}" stroke-width="0.35" fill="none" stroke-dasharray="5,3" opacity="0.2" transform="translate(0.8,0.4)"/>

      <!-- Lapels -->
      <path d="M180,78 L170,115 L190,148 L200,135" stroke="${primary}" stroke-width="0.9" fill="${accent}08"/>
      <path d="M220,78 L230,115 L210,148 L200,135" stroke="${primary}" stroke-width="0.9" fill="${accent}08"/>

      <!-- Buttons -->
      <circle cx="198" cy="210" r="2.5" stroke="${accent}" stroke-width="0.7" fill="${accent}15"/>
      <circle cx="198" cy="250" r="2.5" stroke="${accent}" stroke-width="0.7" fill="${accent}15"/>
      <circle cx="198" cy="290" r="2.5" stroke="${accent}" stroke-width="0.7" fill="${accent}15"/>

      <!-- Pocket flaps -->
      <path d="M152,228 L183,228 L183,234 L152,234" stroke="${primary}" stroke-width="0.5" fill="none" opacity="0.25"/>
      <path d="M217,228 L248,228 L248,234 L217,234" stroke="${primary}" stroke-width="0.5" fill="none" opacity="0.25"/>

      <!-- Breast pocket -->
      <path d="M155,178 L178,178 L178,195 L155,195" stroke="${primary}" stroke-width="0.4" fill="none" opacity="0.2"/>

      ${arm(-1)}${arm(1)}
      ${legs(330)}
    `,

    top: `
      ${head}
      <!-- Top body -->
      <path d="M200,70 C175,70 160,80 155,98
        L140,118 Q134,128 142,135 L158,142
        L155,220 Q155,228 163,228
        L237,228 Q245,228 245,220
        L242,142 L258,135 Q266,128 260,118
        L245,98
        C240,80 225,70 200,70 Z"
        stroke="${primary}" stroke-width="1.4" fill="url(#tex)" opacity="0.85"/>

      <!-- Second stroke -->
      <path d="M200,70 C175,70 160,80 155,98 L140,118 Q134,128 142,135 L158,142 L155,220 Q155,228 163,228 L237,228 Q245,228 245,220 L242,142 L258,135 Q266,128 260,118 L245,98 C240,80 225,70 200,70 Z"
        stroke="${primary}" stroke-width="0.35" fill="none" stroke-dasharray="5,3" opacity="0.2" transform="translate(0.8,0.4)"/>

      <!-- Neckline -->
      <path d="M170,78 Q200,95 230,78" stroke="${primary}" stroke-width="1.1" fill="none"/>

      ${hasVolume ? `
        <ellipse cx="140" cy="120" rx="14" ry="16" stroke="${primary}" stroke-width="0.6" fill="${primary}04" transform="rotate(-10 140 120)"/>
        <ellipse cx="260" cy="120" rx="14" ry="16" stroke="${primary}" stroke-width="0.6" fill="${primary}04" transform="rotate(10 260 120)"/>
      ` : ''}

      <!-- Hem -->
      <path d="M163,226 Q200,232 237,226" stroke="${accent}" stroke-width="0.5" fill="none" opacity="0.35"/>

      ${arm(-1)}${arm(1)}
      ${legs(228)}
    `,
  };

  return garments[template] || garments.dress;
}
