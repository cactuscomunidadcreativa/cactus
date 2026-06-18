// ═══════════════════════════════════════════════════════════════════════════
// Sub-agentes (Fase C · "mil agentes") — un agente descompone su tarea en
// sub-tareas, las ejecuta y consolida. ACOTADO (máx 4 sub-agentes) para controlar
// costo; es opt-in (modo profundo). Devuelve el contenido final + todos los usos.
// ═══════════════════════════════════════════════════════════════════════════
import { generateContent } from '@/lib/ai';

export interface LLMUsage { provider: string; model: string; inputTokens: number; outputTokens: number }
export interface SubAgentResult { content: string; usages: LLMUsage[]; subCount: number }

export async function runWithSubAgents(opts: {
  system: string;
  action: string;
  objective: string;
  max?: number;
}): Promise<SubAgentResult> {
  const max = Math.min(Math.max(opts.max ?? 3, 2), 4);
  const usages: LLMUsage[] = [];

  // 1 · Descompone la tarea
  const plan = await generateContent({
    prompt: `Tarea: "${opts.action}". Objetivo del proyecto: "${opts.objective}".\nDivídela en ${max} sub-tareas concretas y complementarias para producir un entregable excelente. Responde SOLO un arreglo JSON de strings (máximo ${max}).`,
    systemPrompt: opts.system, maxTokens: 400, temperature: 0.5,
  });
  usages.push(plan);

  let parts: string[] = [];
  try {
    const m = plan.content.match(/\[[\s\S]*\]/);
    if (m) parts = JSON.parse(m[0]);
  } catch { /* parse falla → fallback abajo */ }
  parts = (parts || []).filter((p) => typeof p === 'string' && p.trim()).slice(0, max);

  // Sin descomposición útil → ejecución simple
  if (parts.length < 2) {
    const res = await generateContent({ prompt: opts.action, systemPrompt: opts.system, maxTokens: 1200, temperature: 0.7 });
    usages.push(res);
    return { content: res.content, usages, subCount: 0 };
  }

  // 2 · Ejecuta sub-tareas en paralelo
  const subs = await Promise.all(parts.map((p) => generateContent({
    prompt: `Sub-tarea: ${p}\n(Forma parte de: "${opts.action}" — objetivo: "${opts.objective}". Entrega solo esta parte, lista para integrar.)`,
    systemPrompt: opts.system, maxTokens: 700, temperature: 0.7,
  })));
  for (const r of subs) usages.push(r);

  // 3 · Consolida
  const merged = await generateContent({
    prompt: `Integra estas partes en UN entregable final, coherente, pulido y sin repeticiones, para la tarea "${opts.action}":\n\n${subs.map((r, i) => `### ${parts[i]}\n${r.content}`).join('\n\n')}`,
    systemPrompt: opts.system, maxTokens: 1500, temperature: 0.6,
  });
  usages.push(merged);

  return { content: merged.content, usages, subCount: parts.length };
}
