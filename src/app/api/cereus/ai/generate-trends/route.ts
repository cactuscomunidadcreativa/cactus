import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAPIKey } from '@/lib/ai/config';
import { getTrendData } from '@/modules/cereus/lib/trend-engine';

// ─── Archetype descriptions ────────────────────────────────
const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  classic_elegance: 'Elegancia clasica, piezas atemporales, calidad sobre cantidad',
  modern_minimalist: 'Minimalismo moderno, lineas limpias, paleta neutra',
  romantic_dreamer: 'Romantica sonadora, telas fluidas, detalles delicados',
  bold_avant_garde: 'Vanguardista audaz, formas experimentales, impacto visual',
  bohemian_free: 'Bohemia libre, texturas naturales, capas relajadas',
  power_executive: 'Ejecutiva poderosa, sastreria impecable, autoridad elegante',
  ethereal_goddess: 'Diosa eterea, transparencias, movimiento fluido',
  structured_architectural: 'Arquitectonica estructurada, geometria, volumen calculado',
};

// ─── Request body type ─────────────────────────────────────
interface GenerateTrendsRequest {
  maisonId: string;
  market: {
    city: string;
    country: string;
    avgTemp: number;
    humidity: string;
  };
  season: string;
  year: number;
  targetArchetypes: string[];
  budgetRange: { min: number; max: number };
  targetPieces: number;
  referenceImageUrls?: string[];
  notes?: string;
}

// ─── Build user prompt ─────────────────────────────────────
function buildUserPrompt(body: GenerateTrendsRequest): string {
  const { market, season, year, targetArchetypes, budgetRange, targetPieces, referenceImageUrls, notes } = body;

  const archetypeLines = targetArchetypes
    .map(id => {
      const desc = ARCHETYPE_DESCRIPTIONS[id] || id;
      return `  - ${id}: ${desc}`;
    })
    .join('\n');

  const parts: string[] = [
    `## Contexto del Mercado`,
    `- Ciudad: ${market.city}, ${market.country}`,
    `- Temperatura promedio: ${market.avgTemp}°C`,
    `- Humedad: ${market.humidity}`,
    '',
    `## Temporada`,
    `- Temporada: ${season}`,
    `- Ano: ${year}`,
    '',
    `## Arquetipos Objetivo`,
    archetypeLines,
    '',
    `## Presupuesto`,
    `- Rango por pieza: $${budgetRange.min} - $${budgetRange.max} USD`,
    `- Piezas objetivo en la coleccion: ${targetPieces}`,
  ];

  if (referenceImageUrls && referenceImageUrls.length > 0) {
    parts.push('', `## Imagenes de Referencia`);
    parts.push(`El disenador ha subido ${referenceImageUrls.length} imagen(es) de referencia:`);
    referenceImageUrls.forEach((url, i) => parts.push(`  ${i + 1}. ${url}`));
    parts.push('Toma en cuenta el estilo, colores y mood de estas referencias.');
  }

  if (notes) {
    parts.push('', `## Notas del Disenador`, notes);
  }

  parts.push(
    '',
    `## Instrucciones de Generacion`,
    `Genera un JSON con la siguiente estructura exacta:`,
    `- "silhouettes": array de 3-4 siluetas apropiadas para el clima y arquetipos. Cada una con: name, description, garmentTypes (array de tipos como "dress","blouse","skirt","pants","jacket","top","coat","suit"), keywords (array de strings).`,
    `- "colorStories": array de 3-4 historias de color inspiradas en el mercado y mood. Cada una con: name, description, colors (array de hex colors), mood (string).`,
    `- "fabricTrends": array de 3-4 tendencias de tela con gramajes especificos para el clima. Cada una con: name, description, fabrics (array de nombres de telas), finish (string), weightGsm (string como "150-200"), composition (string como "100% seda").`,
    `- "details": array de 3-4 tendencias de detalles constructivos. Cada una con: name, description, elements (array de strings), placement (array de strings).`,
    `- "moodKeywords": array de 6-8 palabras clave de mood.`,
    `- "climateNotes": string con recomendaciones especificas para el clima de ${market.city}.`,
    `- "archetypeNotes": string explicando como estas tendencias conectan con los arquetipos seleccionados.`,
    '',
    `Responde UNICAMENTE con el JSON, sin texto adicional ni bloques de codigo.`,
  );

  return parts.join('\n');
}

// ─── POST handler ──────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse and validate request body
  const body: GenerateTrendsRequest = await request.json();
  const { maisonId, market, season, year } = body;

  if (!maisonId || !market || !season || !year) {
    return NextResponse.json(
      { error: 'maisonId, market, season, and year are required' },
      { status: 400 },
    );
  }

  // 3. Check for API key
  const apiKey = await getAPIKey('claude');

  // 4. If no key, return fallback static data
  if (!apiKey) {
    const fallback = getTrendData(season);
    return NextResponse.json({
      trends: {
        silhouettes: fallback.silhouettes,
        colorStories: fallback.colorStories,
        fabricTrends: fallback.fabricTrends,
        details: fallback.details,
        moodKeywords: fallback.moodKeywords,
        climateNotes: `Datos estaticos de tendencias para ${fallback.season} ${fallback.year}. Configura la API key de Claude para obtener tendencias personalizadas.`,
        archetypeNotes: 'Tendencias genericas sin personalizacion por arquetipo. Configura Claude para recomendaciones alineadas a tus arquetipos.',
      },
      source: 'fallback' as const,
      provider: 'static' as const,
    });
  }

  // 5. Call Claude API
  try {
    const systemPrompt = `Eres un experto en tendencias de moda y pronostico de alta costura.
Generas sugerencias de tendencias PERSONALIZADAS basadas en el contexto del mercado,
clima, arquetipos de clientes y temporada.

SIEMPRE responde en espanol. Responde SOLO en formato JSON valido.
Se creativo, especifico y relevante para el contexto dado.`;

    const userPrompt = buildUserPrompt(body);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        temperature: 0.85,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Claude API error:', res.status, errText);
      // Fall back to static data on API error
      const fallback = getTrendData(season);
      return NextResponse.json({
        trends: {
          silhouettes: fallback.silhouettes,
          colorStories: fallback.colorStories,
          fabricTrends: fallback.fabricTrends,
          details: fallback.details,
          moodKeywords: fallback.moodKeywords,
          climateNotes: `Error al contactar Claude (${res.status}). Mostrando datos estaticos para ${fallback.season} ${fallback.year}.`,
          archetypeNotes: 'Tendencias genericas (fallback por error de API).',
        },
        source: 'fallback' as const,
        provider: 'static' as const,
      });
    }

    const data = await res.json();

    const text = data.content
      ?.filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('') || '';

    // 6. Parse JSON response
    let trends;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        trends = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON object found in response');
      }
    } catch (parseErr) {
      console.error('Failed to parse Claude response:', parseErr, 'Raw:', text);
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: text },
        { status: 500 },
      );
    }

    return NextResponse.json({
      trends: {
        silhouettes: trends.silhouettes || [],
        colorStories: trends.colorStories || [],
        fabricTrends: trends.fabricTrends || [],
        details: trends.details || [],
        moodKeywords: trends.moodKeywords || [],
        climateNotes: trends.climateNotes || '',
        archetypeNotes: trends.archetypeNotes || '',
      },
      source: 'claude' as const,
      provider: 'claude' as const,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI generation failed';
    console.error('Generate trends error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
