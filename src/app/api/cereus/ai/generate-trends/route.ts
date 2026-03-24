import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAPIKey } from '@/lib/ai/config';
import { getTrendData } from '@/modules/cereus/lib/trend-engine';
import { getTrainingContext } from '@/modules/cereus/lib/ai-training-context';

// ─── Request body type ─────────────────────────────────────
interface MarketCity {
  city: string;
  country: string;
  avgTemp: number;
  humidity: string;
}

interface GenerateTrendsRequest {
  maisonId: string;
  market: MarketCity | MarketCity[]; // Support single or multiple
  season: string;
  year: number;
  targetArchetypes: string[];
  budgetRange: { min: number; max: number };
  targetPieces: number;
  referenceImageUrls?: string[];
  notes?: string;
}

// ─── Build creative prompt ──────────────────────────────────
function buildUserPrompt(body: GenerateTrendsRequest): string {
  const { market, season, year, targetArchetypes, budgetRange, targetPieces, referenceImageUrls, notes } = body;

  // Normalize to array
  const markets = Array.isArray(market) ? market : [market];

  const marketDesc = markets.map(m =>
    `${m.city} (${m.country}) — ${m.avgTemp}°C, clima ${m.humidity}`
  ).join('; ');

  const avgTemp = markets.reduce((sum, m) => sum + m.avgTemp, 0) / markets.length;
  const allCities = markets.map(m => m.city).join(', ');

  // Map archetypes to rich descriptions - NOT labels, but creative briefs
  const archetypeCreativeBriefs: Record<string, string> = {
    classic_elegance: 'Mujer que colecciona piezas, no tendencias. Busca lo que perdura. Piensa en Carolyn Bessette, no en logos.',
    modern_minimalist: 'Elimina todo lo que sobra. Cada costura tiene proposito. El silencio visual es su poder.',
    romantic_dreamer: 'Ve poesia en las telas. Le importa como se siente una prenda, no como se ve en fotos. Busca emocion tactil.',
    bold_avant_garde: 'Usa la ropa como manifiesto. No le interesa agradar — le interesa provocar pensamiento. Rei Kawakubo como filosofia.',
    bohemian_free: 'Viaja con una maleta. Mezcla culturas sin apropiarse. Cada prenda tiene una historia de donde la encontro.',
    power_executive: 'Su armario es su armadura blanda. Autoridad sin rigidez. No necesita que la ropa hable fuerte — ella habla.',
    ethereal_goddess: 'Se mueve como si el aire la vistiera. Busca que la tela desaparezca y quede solo la silueta flotando.',
    structured_architectural: 'Ve geometria donde otros ven tela. Cada pliegue es intencional. La prenda se sostiene sola, como una escultura.',
  };

  const archetypeContext = targetArchetypes
    .map(id => archetypeCreativeBriefs[id] || id)
    .join('\n  ');

  const seasonLabels: Record<string, string> = {
    spring_summer: 'Primavera/Verano',
    fall_winter: 'Otono/Invierno',
    resort: 'Resort/Crucero',
    capsule: 'Capsula',
    bridal: 'Nupcial',
  };

  return `Necesito que me ayudes a explorar direcciones creativas para una coleccion de moda.

CONTEXTO:
- Mercados destino: ${marketDesc}
- Temporada: ${seasonLabels[season] || season} ${year}
- Temperatura promedio: ${avgTemp.toFixed(0)}°C
- Presupuesto por pieza: $${budgetRange.min}-$${budgetRange.max} USD
- Piezas objetivo: ${targetPieces}

CLIENTA IDEAL:
  ${archetypeContext}

${notes ? `VISION DEL DISENADOR:\n${notes}\n` : ''}
${referenceImageUrls && referenceImageUrls.length > 0 ? `REFERENCIAS VISUALES: ${referenceImageUrls.length} imagen(es) subidas. Considera el mood y la paleta de estas referencias.\n` : ''}

LA PERSONA QUE VISTE ESTA ROPA — ESTO ES LO MAS IMPORTANTE:
- Estas disenando para personas REALES que viven en ${allCities}. No para un "mercado", sino para mujeres de carne y hueso.
- Tono de piel: Piensa en los tonos de piel reales de las personas en ${allCities}. Si es Lima, piensa en piel trigueña, morena, mestiza con subtonos calidos. Si es Madrid, tonos mediterraneos. Los colores que sugieras DEBEN hacer que esa piel brille.
- Cuerpo real: Estatura media, con curvas, caderas, busto. Las siluetas deben abrazar y favorecer estos cuerpos, no esconderlos ni forzarlos. Piensa en como cae la tela en un cuerpo con volumen, no en una percha.
- Vida real: Estas personas trabajan, salen, caminan, se mueven. La ropa tiene que vivir con ellas, no solo verse bien en fotos.

IMPORTANTE — REGLAS CREATIVAS:
1. NUNCA sugieras cadenas, eslabones, herrajes metalicos industriales, estetica dominatrix, ni nada que suene a "poder agresivo". Eso es un cliche que se repite siempre. PROHIBIDO.
2. NO uses frases como "fusion de", "donde X se encuentra con Y", "la fuerza de X con la suavidad de Y". Cliche.
3. NO nombres las siluetas como si fueran titulos de pelicula. Nombres descriptivos y tecnicos.
4. Se ESPECIFICO: en vez de "telas fluidas", di exactamente cual tela, que gramaje, que caida.
5. Los colores deben tener NOMBRES CONCRETOS de cosas que la clienta conoce — la chicha morada, el atardecer en Barranco, la tierra de Cusco, el mar de Asia, no abstracciones.
6. Piensa en ${allCities} desde DENTRO — como viven, que comen, a donde van, que les gusta, como es su dia, que musica escuchan.
7. Cada sugerencia debe poder fabricarse con el presupuesto dado.
8. Los detalles constructivos deben ser REALIZABLES en taller, no decorativos.
9. Sorprendeme — dame combinaciones que no esperaria. Piensa en poesia, naturaleza, artesania, textiles ancestrales, gastronomia, arquitectura local.
10. VARIA cada vez — nunca repitas la misma formula. Si antes sugeriste algo estructurado, ahora sugiere algo completamente diferente.

Responde en JSON con esta estructura exacta:
{
  "silhouettes": [
    { "name": "nombre tecnico corto", "description": "descripcion especifica de como se construye", "garmentTypes": ["dress","blouse","skirt","pants","jacket","top","coat","suit"], "keywords": ["palabra1","palabra2"] }
  ],
  "colorStories": [
    { "name": "nombre concreto (no abstracto)", "description": "de donde viene este color, que evoca", "colors": ["#hex1","#hex2","#hex3","#hex4","#hex5"], "mood": "frase corta" }
  ],
  "fabricTrends": [
    { "name": "nombre de la tela", "description": "por que esta tela para este mercado y clima", "fabrics": ["tela especifica con gramaje"], "finish": "tipo de acabado", "weightGsm": "rango gsm", "composition": "composicion exacta" }
  ],
  "details": [
    { "name": "nombre del detalle", "description": "como se ejecuta en taller", "elements": ["tecnica1","tecnica2"], "placement": ["donde va en la prenda"] }
  ],
  "moodKeywords": ["palabra1","palabra2","palabra3","palabra4","palabra5","palabra6"],
  "climateNotes": "recomendaciones practicas para ${allCities} considerando temperatura y humedad",
  "archetypeNotes": "como estas propuestas conectan con la clienta descrita — sin repetir las palabras del brief"
}

Dame 3-4 items por categoria. Se creativo pero REALISTA. Responde SOLO el JSON.`;
}

// ─── System prompt ──────────────────────────────────────────
const SYSTEM_PROMPT = `Eres un consultor de moda independiente con 20 anos de experiencia trabajando con marcas emergentes en Latinoamerica y Europa.

Tu estilo de trabajo:
- Hablas en espanol, directo, sin adornos
- Conoces las realidades de produccion en talleres pequenos y medianos
- No repites formulas: cada coleccion es unica
- Tus sugerencias son fabricables, no solo bonitas en papel
- Evitas los cliches de la moda (no dices "fusion", "dialogo entre", "donde X se encuentra con Y")
- NUNCA sugieres cadenas, eslabones metalicos, estetica agresiva o dominatrix. Eso es el cliche mas repetido.
- Das recomendaciones inesperadas pero justificadas
- Piensas en el mercado real, no en la pasarela
- Consideras SIEMPRE el tono de piel y la contextura corporal del mercado destino
- Los colores que sugieres deben favorecer los tonos de piel reales del mercado, no solo verse bien en foto
- Las siluetas deben funcionar en cuerpos reales, no solo en modelos de 1.80m
- Tu inspiracion viene de la cultura local, la naturaleza, la gastronomia, los textiles ancestrales — no de cliches de moda europea

Responde UNICAMENTE en JSON valido. Sin texto antes ni despues. Sin bloques de codigo.`;

// ─── POST handler ──────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: GenerateTrendsRequest = await request.json();
  const { maisonId, market, season, year } = body;

  if (!maisonId || !market || !season || !year) {
    return NextResponse.json(
      { error: 'maisonId, market, season, and year are required' },
      { status: 400 },
    );
  }

  const apiKey = await getAPIKey('claude');

  // Fallback to static data if no API key
  if (!apiKey) {
    const fallback = getTrendData(season);
    return NextResponse.json({
      trends: {
        silhouettes: fallback.silhouettes,
        colorStories: fallback.colorStories,
        fabricTrends: fallback.fabricTrends,
        details: fallback.details,
        moodKeywords: fallback.moodKeywords,
        climateNotes: 'Configura tu API key de Anthropic para sugerencias personalizadas.',
        archetypeNotes: '',
      },
      source: 'fallback',
      provider: 'static',
    });
  }

  // Call Claude
  try {
    const trainingContext = await getTrainingContext(maisonId);
    const userPrompt = buildUserPrompt(body);
    const finalUserPrompt = trainingContext
      ? `${trainingContext}\n\n${userPrompt}`
      : userPrompt;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        temperature: 0.9, // Higher for more creativity
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: finalUserPrompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Claude API error: ${res.status}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';

    // Parse JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const trends = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      trends,
      source: 'claude',
      provider: 'claude',
    });
  } catch (error) {
    // Graceful fallback
    const fallback = getTrendData(season);
    return NextResponse.json({
      trends: {
        silhouettes: fallback.silhouettes,
        colorStories: fallback.colorStories,
        fabricTrends: fallback.fabricTrends,
        details: fallback.details,
        moodKeywords: fallback.moodKeywords,
        climateNotes: `Error al generar: ${error instanceof Error ? error.message : 'desconocido'}. Usando datos estaticos.`,
        archetypeNotes: '',
      },
      source: 'fallback',
      provider: 'static',
    });
  }
}
