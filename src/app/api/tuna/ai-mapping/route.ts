import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAPIKey } from '@/lib/ai/config';

interface MappingRequest {
  campaignId: string;
  budgetCategories: {
    name: string;
    process: string;
  }[];
  eeffConcepts: string[];
}

interface SuggestedMapping {
  budgetCategory: string;
  budgetProcess: string;
  eeffConcept: string;
  confidence: number;
  matchType: 'exact' | 'suggested' | 'none';
  reason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Error de conexión' }, { status: 500 });
    }

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: MappingRequest = await request.json();
    const { campaignId, budgetCategories, eeffConcepts } = body;

    if (!campaignId || !budgetCategories?.length || !eeffConcepts?.length) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: campaignId, budgetCategories, eeffConcepts' },
        { status: 400 }
      );
    }

    // Verificar que la campaña pertenece al usuario
    const { data: campaign, error: campaignError } = await supabase
      .from('tuna_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
    }

    // Generar mapeos con IA
    const mappings = await generateAIMappings(budgetCategories, eeffConcepts);

    // Guardar mapeos en la base de datos
    const mappingsToInsert = mappings.map((m) => ({
      campaign_id: campaignId,
      budget_category: m.budgetCategory,
      budget_process: m.budgetProcess,
      eeff_concept: m.eeffConcept,
      confidence: m.confidence,
      match_type: m.matchType,
      confirmed: m.matchType === 'exact', // Auto-confirmar mapeos exactos
      confirmed_at: m.matchType === 'exact' ? new Date().toISOString() : null,
    }));

    // Upsert para evitar duplicados
    const { error: insertError } = await supabase
      .from('tuna_category_mappings')
      .upsert(mappingsToInsert, {
        onConflict: 'campaign_id,budget_category,budget_process',
      });

    if (insertError) {
      console.error('Error inserting mappings:', insertError);
      return NextResponse.json({ error: 'Error al guardar mapeos' }, { status: 500 });
    }

    // Estadísticas
    const exact = mappings.filter((m) => m.matchType === 'exact').length;
    const suggested = mappings.filter((m) => m.matchType === 'suggested').length;
    const none = mappings.filter((m) => m.matchType === 'none').length;

    return NextResponse.json({
      success: true,
      mappings,
      stats: {
        total: mappings.length,
        exact,
        suggested,
        none,
      },
    });
  } catch (error) {
    console.error('Error in AI mapping:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

async function generateAIMappings(
  budgetCategories: { name: string; process: string }[],
  eeffConcepts: string[]
): Promise<SuggestedMapping[]> {
  const mappings: SuggestedMapping[] = [];

  // Primero, intentar mapeos exactos (sin IA)
  const exactMappings = findExactMappings(budgetCategories, eeffConcepts);
  mappings.push(...exactMappings);

  // Obtener categorías que no tienen mapeo exacto
  const unmappedCategories = budgetCategories.filter(
    (cat) => !exactMappings.some((m) => m.budgetCategory === cat.name && m.budgetProcess === cat.process)
  );

  // Obtener conceptos EEFF que no han sido mapeados
  const mappedConcepts = new Set(exactMappings.map((m) => m.eeffConcept));
  const availableConcepts = eeffConcepts.filter((c) => !mappedConcepts.has(c));

  // Si hay categorías sin mapear, usar IA
  if (unmappedCategories.length > 0 && availableConcepts.length > 0) {
    try {
      const aiMappings = await callClaudeForMappings(unmappedCategories, availableConcepts);
      mappings.push(...aiMappings);
    } catch (error) {
      console.error('Error calling Claude:', error);
      // Agregar categorías sin mapeo
      unmappedCategories.forEach((cat) => {
        if (!mappings.some((m) => m.budgetCategory === cat.name && m.budgetProcess === cat.process)) {
          mappings.push({
            budgetCategory: cat.name,
            budgetProcess: cat.process,
            eeffConcept: '',
            confidence: 0,
            matchType: 'none',
          });
        }
      });
    }
  }

  return mappings;
}

function findExactMappings(
  budgetCategories: { name: string; process: string }[],
  eeffConcepts: string[]
): SuggestedMapping[] {
  const mappings: SuggestedMapping[] = [];
  const usedConcepts = new Set<string>();

  // Normalizar texto para comparación
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z0-9]/g, ' ')
      .trim();

  // Crear mapa de conceptos EEFF normalizados
  const conceptMap = new Map<string, string>();
  eeffConcepts.forEach((c) => {
    conceptMap.set(normalize(c), c);
  });

  for (const cat of budgetCategories) {
    const normalizedCat = normalize(cat.name);

    // Buscar coincidencia exacta o muy cercana
    const conceptEntries = Array.from(conceptMap.entries());
    for (const entry of conceptEntries) {
      const [normalizedConcept, originalConcept] = entry;
      if (usedConcepts.has(originalConcept)) continue;

      // Coincidencia exacta
      if (normalizedCat === normalizedConcept) {
        mappings.push({
          budgetCategory: cat.name,
          budgetProcess: cat.process,
          eeffConcept: originalConcept,
          confidence: 100,
          matchType: 'exact',
        });
        usedConcepts.add(originalConcept);
        break;
      }

      // Coincidencia parcial muy alta (una palabra contiene la otra)
      if (
        (normalizedCat.includes(normalizedConcept) || normalizedConcept.includes(normalizedCat)) &&
        normalizedCat.length > 3 &&
        normalizedConcept.length > 3
      ) {
        mappings.push({
          budgetCategory: cat.name,
          budgetProcess: cat.process,
          eeffConcept: originalConcept,
          confidence: 95,
          matchType: 'exact',
        });
        usedConcepts.add(originalConcept);
        break;
      }
    }
  }

  return mappings;
}

async function callClaudeForMappings(
  budgetCategories: { name: string; process: string }[],
  eeffConcepts: string[]
): Promise<SuggestedMapping[]> {
  // Get API key from centralized config (DB or env)
  const apiKey = await getAPIKey('claude');

  if (!apiKey) {
    console.warn('No Anthropic API key configured, using fallback mapping');
    return fallbackMappings(budgetCategories, eeffConcepts);
  }

  const client = new Anthropic({ apiKey });

  const prompt = `Eres un experto en contabilidad agrícola. Tu tarea es mapear categorías de presupuesto con conceptos de gasto de un EEFF (Estado de Resultados).

CATEGORÍAS DE PRESUPUESTO (por proceso):
${budgetCategories.map((c) => `- "${c.name}" (${c.process})`).join('\n')}

CONCEPTOS DE GASTO EEFF DISPONIBLES:
${eeffConcepts.map((c) => `- "${c}"`).join('\n')}

Para cada categoría de presupuesto, encuentra el concepto EEFF más relacionado semánticamente.
Considera: sinónimos, abreviaciones (3ROS = terceros), variaciones ortográficas, y el contexto agrícola.

Responde SOLO con un JSON array válido, sin explicaciones adicionales:
[
  {
    "budgetCategory": "nombre exacto de la categoría",
    "budgetProcess": "proceso exacto",
    "eeffConcept": "concepto EEFF más similar (vacío si no hay match)",
    "confidence": número del 0-100,
    "reason": "breve explicación"
  }
]`;

  try {
    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Extraer JSON de la respuesta
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const results = JSON.parse(jsonMatch[0]) as Array<{
      budgetCategory: string;
      budgetProcess: string;
      eeffConcept: string;
      confidence: number;
      reason?: string;
    }>;

    return results.map((r) => ({
      budgetCategory: r.budgetCategory,
      budgetProcess: r.budgetProcess,
      eeffConcept: r.eeffConcept || '',
      confidence: r.confidence,
      matchType: r.eeffConcept ? 'suggested' : 'none',
      reason: r.reason,
    }));
  } catch (error) {
    console.error('Error parsing Claude response:', error);
    return fallbackMappings(budgetCategories, eeffConcepts);
  }
}

function fallbackMappings(
  budgetCategories: { name: string; process: string }[],
  eeffConcepts: string[]
): SuggestedMapping[] {
  // Mapeos conocidos basados en análisis previo
  const knownMappings: Record<string, string> = {
    'agroquimicos': 'AGROQUIMICOS & FOLIAR',
    'agroquímicos': 'AGROQUIMICOS & FOLIAR',
    'foliares': 'AGROQUIMICOS & FOLIAR',
    'servicio de terceros': 'SERVIC. DE 3ROS.',
    'servicios terceros': 'SERVIC. DE 3ROS.',
    'personal eventual': 'OTROS GTOS DE PERSONAL',
    'mano de obra': 'OTROS GTOS DE PERSONAL',
    'transport': 'TRANSPORTE DE CARGA',
    'transporte': 'TRANSPORTE DE CARGA',
    'alquiler de campo': 'ALQUILER DE TERRENOS',
    'alquiler campo': 'ALQUILER DE TERRENOS',
    'alquiler maquinaria': 'ALQUILER DE MAQUINARIA',
    'energia': 'ENERGIA ELECTRICA',
    'energía': 'ENERGIA ELECTRICA',
    'combustible': 'COMBUSTIBLE',
    'gas': 'COMBUSTIBLE',
  };

  const normalize = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  return budgetCategories.map((cat) => {
    const normalizedCat = normalize(cat.name);

    // Buscar en mapeos conocidos
    for (const [key, value] of Object.entries(knownMappings)) {
      if (normalizedCat.includes(key)) {
        const concept = eeffConcepts.find((c) => c === value);
        if (concept) {
          return {
            budgetCategory: cat.name,
            budgetProcess: cat.process,
            eeffConcept: concept,
            confidence: 85,
            matchType: 'suggested' as const,
          };
        }
      }
    }

    // Sin mapeo
    return {
      budgetCategory: cat.name,
      budgetProcess: cat.process,
      eeffConcept: '',
      confidence: 0,
      matchType: 'none' as const,
    };
  });
}

// GET: Obtener mapeos existentes para una campaña
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Error de conexión' }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId requerido' }, { status: 400 });
    }

    const { data: mappings, error } = await supabase
      .from('tuna_category_mappings')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('budget_process')
      .order('budget_category');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ mappings });
  } catch (error) {
    console.error('Error fetching mappings:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PATCH: Actualizar mapeos (confirmar, corregir, ignorar)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Error de conexión' }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { mappingId, eeffConcept, confirmed, matchType } = body;

    if (!mappingId) {
      return NextResponse.json({ error: 'mappingId requerido' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (eeffConcept !== undefined) updates.eeff_concept = eeffConcept;
    if (confirmed !== undefined) {
      updates.confirmed = confirmed;
      updates.confirmed_at = confirmed ? new Date().toISOString() : null;
    }
    if (matchType !== undefined) updates.match_type = matchType;

    const { data, error } = await supabase
      .from('tuna_category_mappings')
      .update(updates)
      .eq('id', mappingId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ mapping: data });
  } catch (error) {
    console.error('Error updating mapping:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
