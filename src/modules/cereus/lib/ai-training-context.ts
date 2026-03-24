import { createServiceClient } from '@/lib/supabase/service';

// ─── TYPES ──────────────────────────────────────────────────

export interface AITrainingData {
  // Brand Identity
  brandVoice: string;
  brandValues: string[];
  targetAudience: string;

  // Style Preferences
  styleKeywords: string[];
  avoidKeywords: string[];

  // Color Preferences
  preferredColors: string[];
  avoidColors: string[];
  skinToneContext: string;

  // Fabric Preferences
  preferredFabrics: string[];
  avoidFabrics: string[];

  // Body/Fit Preferences
  bodyContext: string;
  fitPreferences: string;

  // Design Rules
  designRules: string;

  // Inspiration
  inspirationBrands: string[];
  inspirationNotes: string;

  // AI Behavior
  creativityLevel: number;
  languagePreference: string;

  // Example outputs
  likedExamples: { type: string; content: string; date: string }[];
  dislikedExamples: { type: string; content: string; reason: string; date: string }[];

  // Piece vocabulary
  pieceVocabulary: Record<string, {
    designerMeaning: string;
    defaultSilhouette: string;
    keyDetails: string[];
    fitNotes: string;
    versatility: string;
  }>;
}

// ─── CONSTANTS ──────────────────────────────────────────────

const CREATIVITY_LABELS: Record<number, string> = {
  1: 'Clasico y seguro',
  2: 'Muy conservador',
  3: 'Conservador',
  4: 'Ligeramente conservador',
  5: 'Equilibrado',
  6: 'Ligeramente experimental',
  7: 'Creativo',
  8: 'Bastante experimental',
  9: 'Muy experimental',
  10: 'Experimental y arriesgado',
};

const PIECE_TYPE_NAMES: Record<string, string> = {
  dress: 'Vestido',
  gown: 'Vestido de Gala',
  suit: 'Traje',
  blazer: 'Blazer',
  coat: 'Abrigo',
  skirt: 'Falda',
  pants: 'Pantalon',
  blouse: 'Blusa',
  shirt: 'Camisa',
  jumpsuit: 'Jumpsuit',
  cape: 'Capa',
  corset: 'Corset',
  top: 'Top',
  crop_top: 'Crop Top',
  vest: 'Chaleco',
  kimono: 'Kimono',
  poncho: 'Poncho',
  shorts: 'Short',
  bermuda: 'Bermuda',
  bodysuit: 'Body',
  accessory: 'Accesorio',
};

// ─── BUILD TRAINING PROMPT ──────────────────────────────────

/**
 * Server-side version of buildAITrainingContext.
 * Converts AITrainingData into a text block that can be prepended to AI prompts.
 */
export function buildTrainingPrompt(training: AITrainingData): string {
  const lines: string[] = [];
  lines.push('=== PREFERENCIAS DE LA DISENADORA ===');
  lines.push('');

  if (training.brandVoice) {
    lines.push(`Voz de marca: ${training.brandVoice}`);
  }
  if (training.brandValues.length > 0) {
    lines.push(`Valores: ${training.brandValues.join(', ')}`);
  }
  if (training.targetAudience) {
    lines.push(`Publico objetivo: ${training.targetAudience}`);
  }
  lines.push('');

  if (training.styleKeywords.length > 0) {
    lines.push(`Estilo: ${training.styleKeywords.join(', ')}`);
  }
  if (training.avoidKeywords.length > 0) {
    lines.push(`NUNCA usar: ${training.avoidKeywords.join(', ')}`);
  }
  lines.push('');

  if (training.preferredColors.length > 0) {
    lines.push(`Colores preferidos: ${training.preferredColors.join(', ')}`);
  }
  if (training.avoidColors.length > 0) {
    lines.push(`Colores a evitar: ${training.avoidColors.join(', ')}`);
  }
  if (training.skinToneContext) {
    lines.push(`Contexto de piel: ${training.skinToneContext}`);
  }
  lines.push('');

  if (training.preferredFabrics.length > 0) {
    lines.push(`Telas preferidas: ${training.preferredFabrics.join(', ')}`);
  }
  if (training.avoidFabrics.length > 0) {
    lines.push(`Telas a evitar: ${training.avoidFabrics.join(', ')}`);
  }
  lines.push('');

  if (training.bodyContext) {
    lines.push(`Contexto corporal: ${training.bodyContext}`);
  }
  if (training.fitPreferences) {
    lines.push(`Preferencias de ajuste: ${training.fitPreferences}`);
  }
  lines.push('');

  if (training.designRules) {
    lines.push(`Reglas de diseno:`);
    training.designRules.split('\n').forEach((rule, i) => {
      const trimmed = rule.trim();
      if (trimmed) lines.push(`  ${i + 1}. ${trimmed}`);
    });
  }
  lines.push('');

  if (training.inspirationBrands.length > 0) {
    lines.push(`Marcas de inspiracion: ${training.inspirationBrands.join(', ')}`);
  }
  if (training.inspirationNotes) {
    lines.push(`Notas de inspiracion: ${training.inspirationNotes}`);
  }
  lines.push('');

  lines.push(`Creatividad: ${training.creativityLevel}/10 (${CREATIVITY_LABELS[training.creativityLevel] ?? 'Equilibrado'})`);
  lines.push(`Idioma: ${training.languagePreference}`);

  if (training.likedExamples.length > 0) {
    lines.push('');
    lines.push('Ejemplos que le gustaron:');
    training.likedExamples.forEach((ex) => {
      lines.push(`  - [${ex.type}] ${ex.content}`);
    });
  }

  if (training.dislikedExamples.length > 0) {
    lines.push('');
    lines.push('Ejemplos que NO le gustaron:');
    training.dislikedExamples.forEach((ex) => {
      lines.push(`  - [${ex.type}] ${ex.content} (Razon: ${ex.reason})`);
    });
  }

  // Piece vocabulary
  if (training.pieceVocabulary && Object.keys(training.pieceVocabulary).length > 0) {
    lines.push('');
    lines.push('=== VOCABULARIO DE PIEZAS (que significa cada tipo para la disenadora) ===');
    for (const [type, def] of Object.entries(training.pieceVocabulary)) {
      if (!def.designerMeaning && !def.defaultSilhouette) continue;
      const pieceName = PIECE_TYPE_NAMES[type] || type;
      lines.push(`${pieceName}:`);
      if (def.designerMeaning) lines.push(`  Significado: ${def.designerMeaning}`);
      if (def.defaultSilhouette) lines.push(`  Silueta: ${def.defaultSilhouette}`);
      if (def.keyDetails?.length > 0) lines.push(`  Detalles clave: ${def.keyDetails.join(', ')}`);
      if (def.fitNotes) lines.push(`  Ajuste: ${def.fitNotes}`);
      if (def.versatility) lines.push(`  Versatilidad: ${def.versatility}`);
    }
  }

  lines.push('');
  lines.push('=== FIN PREFERENCIAS ===');

  return lines.join('\n');
}

// ─── GET TRAINING CONTEXT ───────────────────────────────────

const EMPTY_TRAINING: AITrainingData = {
  brandVoice: '',
  brandValues: [],
  targetAudience: '',
  styleKeywords: [],
  avoidKeywords: [],
  preferredColors: [],
  avoidColors: [],
  skinToneContext: '',
  preferredFabrics: [],
  avoidFabrics: [],
  bodyContext: '',
  fitPreferences: '',
  designRules: '',
  inspirationBrands: [],
  inspirationNotes: '',
  creativityLevel: 5,
  languagePreference: 'es',
  likedExamples: [],
  dislikedExamples: [],
  pieceVocabulary: {},
};

/**
 * Load AI training data from the maison's config and build the prompt context string.
 * Returns empty string if no training data is configured.
 */
export async function getTrainingContext(maisonId: string): Promise<string> {
  try {
    const db = createServiceClient();
    if (!db) return '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: maison } = await db
      .from('app_clients')
      .select('config')
      .eq('id', maisonId)
      .eq('activo', true)
      .single();

    if (!maison) return '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = (maison as any).config ?? {};
    const aiTraining = config.ai_training;

    if (!aiTraining) return '';

    const training: AITrainingData = {
      ...EMPTY_TRAINING,
      ...aiTraining,
    };

    // Check if there's any meaningful data
    const hasData =
      training.brandVoice ||
      training.brandValues.length > 0 ||
      training.targetAudience ||
      training.styleKeywords.length > 0 ||
      training.avoidKeywords.length > 0 ||
      training.preferredColors.length > 0 ||
      training.avoidColors.length > 0 ||
      training.preferredFabrics.length > 0 ||
      training.avoidFabrics.length > 0 ||
      training.designRules ||
      training.inspirationBrands.length > 0 ||
      (training.pieceVocabulary && Object.keys(training.pieceVocabulary).length > 0);

    if (!hasData) return '';

    return buildTrainingPrompt(training);
  } catch {
    // Non-blocking: if training data fails to load, continue without it
    return '';
  }
}
