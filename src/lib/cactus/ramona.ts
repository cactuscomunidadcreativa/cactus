// ═══════════════════════════════════════════════════════════════════════════
// RAMONA · Orquestadora
// Recibe un objetivo del usuario → detecta intención → arma un plan de agentes.
// Si el plan incluye una campaña, esa parte ya se puede EJECUTAR con el motor EQ.
// ═══════════════════════════════════════════════════════════════════════════

import { generateContent } from '@/lib/ai';
import { AGENTS, getAgent } from './agents-catalog';
import { buildBrandContext, type BrandKit } from './brain';

export interface PlanStep {
  agentSlug: string;
  agentName: string;
  emoji: string;
  color: string;
  action: string;
  status: 'ready' | 'soon';
}

export interface RamonaPlan {
  intent: string;
  summary: string;
  steps: PlanStep[];
  /** capacidad ejecutable hoy desde el plan (por ahora: campaña emocional) */
  executable: 'campaign' | null;
}

function extractJson(text: string): any {
  let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const s = t.indexOf('{'), e = t.lastIndexOf('}');
  if (s !== -1 && e !== -1) t = t.slice(s, e + 1);
  return JSON.parse(t);
}

const AGENT_MENU = AGENTS
  .filter((a) => a.slug !== 'ramona')
  .map((a) => `- ${a.slug} (${a.name}): ${a.role}`)
  .join('\n');

export const RAMONA_SYSTEM = `Eres Ramona, la coordinadora general de Cactus Comunidad Creativa.
Recibes un objetivo de negocio y decides qué agentes-cactus activar y en qué orden para lograrlo.
Eres concreta, cálida y ejecutiva. Respondes SOLO JSON válido.

Agentes disponibles (usa SOLO estos slugs):
${AGENT_MENU}`;

export async function planFromGoal(params: { goal: string; brand?: BrandKit | null }): Promise<RamonaPlan> {
  const brandCtx = buildBrandContext(params.brand);
  const prompt = `${brandCtx ? brandCtx + '\n\n' : ''}OBJETIVO DEL USUARIO: ${params.goal}

Arma el plan. Devuelve EXACTAMENTE este JSON:
{"intent":"<intención en 2-4 palabras>","summary":"<1 frase de cómo lo abordas>","steps":[{"agentSlug":"<slug válido>","action":"<qué hace ese agente para este objetivo, 1 frase>"}],"executable":"campaign" | null}

Reglas:
- 3 a 7 pasos, en orden lógico.
- Si el objetivo implica comunicar/vender/lanzar contenido, pon "executable":"campaign" (Peyote + el motor emocional pueden ejecutarlo ya).
- Si no, "executable":null.`;

  const res = await generateContent({ prompt, systemPrompt: RAMONA_SYSTEM, maxTokens: 1500, temperature: 0.6 });

  let parsed: any;
  try { parsed = extractJson(res.content); } catch { throw new Error('Ramona no devolvió un plan válido. Reintenta.'); }

  const steps: PlanStep[] = (parsed.steps || [])
    .map((s: any) => {
      const a = getAgent(s.agentSlug);
      if (!a) return null;
      return {
        agentSlug: a.slug,
        agentName: a.name,
        emoji: a.emoji,
        color: a.color,
        action: String(s.action || a.role),
        status: a.status === 'soon' ? 'soon' : 'ready',
      } as PlanStep;
    })
    .filter(Boolean);

  return {
    intent: String(parsed.intent || 'Plan'),
    summary: String(parsed.summary || ''),
    steps,
    executable: parsed.executable === 'campaign' ? 'campaign' : null,
  };
}
