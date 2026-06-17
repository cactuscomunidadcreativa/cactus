// ═══════════════════════════════════════════════════════════════════════════
// CACTUS · Motor Emocional — generador Multi-Ángulo
// Brief + audiencia + objetivo → UNA variante por perfil, cada una con su
// ángulo (procesamiento/cambio/horizonte) para gatillar la emoción objetivo.
// Esto es lo que hace "click emocional": el mismo mensaje, varios gatillos.
// ═══════════════════════════════════════════════════════════════════════════

import { generateContent } from '@/lib/ai';
import { estimateCostUsd, usdToCredits } from '@/lib/cactus/credits';
import {
  PROFILES, PROFILE_AXIS, OBJECTIVES, CHANNELS,
  type ProfileKey, type ObjectiveKey, type ChannelKey,
} from './profiles';

export interface BrandBrief {
  brandName: string;
  /** qué vende / ofrece */
  offer: string;
  /** a quién le habla */
  audience: string;
  /** tono de marca (opcional) */
  tone?: string;
  /** la idea / mensaje a comunicar */
  brief: string;
}

export interface AngleVariant {
  profile: ProfileKey;
  profileName: string;
  emoji: string;
  color: string;
  procesamiento: string;
  cambio: string;
  horizonte: string;
  emotion: string;
  headline: string;
  body: string;
  cta: string;
  rationale: string;
}

export interface GenerateResult {
  variants: AngleVariant[];
  objective: string;
  channel: string;
  usage: { inputTokens: number; outputTokens: number; model: string; costUsd: number; credits: number };
}

function extractJson(text: string): any {
  let t = text.trim();
  // quitar fences ```json ... ```
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start !== -1 && end !== -1) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

export const PEYOTE_SYSTEM = `Eres Peyote, el estratega creativo y emocional de Cactus Comunidad Creativa.
Dominas el modelo Six Seconds de inteligencia emocional: sabes que cada persona decide
distinto según su estilo cerebral. Tu trabajo es escribir, para UN mismo mensaje, varias
versiones — una por cada estilo — de modo que cada una haga "click emocional" con su público.

Reglas:
- Hablas en español, con la voz de la marca indicada.
- Cada variante usa EXACTAMENTE el ángulo del estilo asignado (su receta) y EVITA su veneno.
- Todas apuntan a gatillar la MISMA emoción objetivo, pero por caminos distintos.
- Copys reales y listos para publicar, no descripciones. Adapta longitud al canal.
- Responde SOLO un JSON válido, sin texto extra.`;

export async function generateAngles(params: {
  brand: BrandBrief;
  objective: ObjectiveKey;
  channel: ChannelKey;
  profiles: ProfileKey[];
}): Promise<GenerateResult> {
  const { brand, objective, channel } = params;
  const obj = OBJECTIVES.find((o) => o.key === objective)!;
  const ch = CHANNELS.find((c) => c.key === channel)!;
  const profiles = params.profiles.length ? params.profiles : (Object.keys(PROFILES) as ProfileKey[]);

  const profileBlock = profiles.map((k) => {
    const p = PROFILES[k];
    const ax = PROFILE_AXIS[k];
    return `- ${k} (${p.name} ${p.emoji}): ángulo = ${p.angle} | evita = ${p.avoid} | ejes sugeridos = ${ax.procesamiento}, ${ax.cambio}, ${ax.horizonte}`;
  }).join('\n');

  const prompt = `MARCA: ${brand.brandName}
OFRECE: ${brand.offer}
AUDIENCIA: ${brand.audience}
${brand.tone ? `TONO DE MARCA: ${brand.tone}` : ''}
MENSAJE / IDEA A COMUNICAR: ${brand.brief}

OBJETIVO EMOCIONAL: ${obj.label} — ${obj.hint}
CANAL: ${ch.label} (${ch.hint})

Escribe UNA variante por cada uno de estos estilos:
${profileBlock}

Para cada variante devuelve: profile (la clave exacta), emotion (la emoción concreta que gatilla),
headline (gancho), body (cuerpo del mensaje), cta (llamado a la acción), rationale (1 frase: por qué
funciona con ese estilo).

Formato EXACTO:
{"variants":[{"profile":"cientifico","emotion":"...","headline":"...","body":"...","cta":"...","rationale":"..."}]}`;

  const res = await generateContent({
    prompt,
    systemPrompt: PEYOTE_SYSTEM,
    maxTokens: 3000,
    temperature: 0.8,
  });

  let parsed: any;
  try {
    parsed = extractJson(res.content);
  } catch {
    throw new Error('El modelo no devolvió JSON válido. Reintenta.');
  }

  const variants: AngleVariant[] = (parsed.variants || [])
    .map((v: any) => {
      const key = v.profile as ProfileKey;
      const p = PROFILES[key];
      if (!p) return null;
      const ax = PROFILE_AXIS[key];
      return {
        profile: key,
        profileName: p.name,
        emoji: p.emoji,
        color: p.color,
        procesamiento: ax.procesamiento,
        cambio: ax.cambio,
        horizonte: ax.horizonte,
        emotion: String(v.emotion || obj.label),
        headline: String(v.headline || ''),
        body: String(v.body || ''),
        cta: String(v.cta || ''),
        rationale: String(v.rationale || ''),
      } as AngleVariant;
    })
    .filter(Boolean);

  const costUsd = estimateCostUsd({
    model: res.provider === 'claude' ? 'claude' : 'gpt',
    inputTokens: res.inputTokens,
    outputTokens: res.outputTokens,
  });

  return {
    variants,
    objective: obj.label,
    channel: ch.label,
    usage: {
      inputTokens: res.inputTokens,
      outputTokens: res.outputTokens,
      model: res.model,
      costUsd,
      credits: usdToCredits(costUsd),
    },
  };
}
